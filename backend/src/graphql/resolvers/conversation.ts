import { ApolloError } from "apollo-server-core";
import { ConversationPopulated, GraphQLContext } from "../../util/types";
import { Prisma } from "@prisma/client";

const resolvers = {
  Query: {
    conversations: async (_: any, __: any, context: GraphQLContext):Promise<Array<ConversationPopulated>> => {
      //console.log("Conversation Query");

      const { session, prisma } = context
      if (!session?.user) {
        throw new ApolloError('Not Authorized')
      }
      const { user: { id: userId } } = session
      try {
        //find all the conversation that user is part of
        //have bug
        // const conversation = await prisma.conversation.findMany({
        //   where: {
        //     participants: {
        //       some: {
        //         userId: {
        //           equals:userId
        //         }
        //       }
        //     }
        //   }
        // })
        const conversations = await prisma.conversation.findMany({
          include:conversationPopulated
        })
        //find all the conversation that user is not part of
        return conversations.filter(conversation=>!!conversation.participants.find(p=>p.userId===userId))
        
      } catch (error: any) {
        console.log('conversation error', error)
        throw new ApolloError(error?.message)
      }

    },
  },
  Mutation: {
    createConversation: async (
      _: any,
      args: { participantIds: Array<string> },
      context: GraphQLContext
    ): Promise<{ conversationId: string }> => {
      const { session, prisma } = context;
      const { participantIds } = args;
      if (!session?.user) {
        throw new ApolloError("No Authorization");
      }
      const {
        user: { id: userId },
      } = session;
      try {
        const conversation = await prisma.conversation.create({
          data: {
            participants: {
              createMany: {
                data: participantIds.map((id) => ({
                  userId: id,
                  hasSeenLatestMessage: id === userId, //user who create the conversation can has aware of the updates for other the conversation is unread
                })),
              },
            },
          },
          include: conversationPopulated,
        });
        //emit a Conversation Created event using pubsub
        return {
          conversationId: conversation.id,
        };
      } catch (error: any) {
        throw new ApolloError("Error creating conversation");
      }
    },
  },
};

export const participantPopulated =
  Prisma.validator<Prisma.ConversationParticipantInclude>()({
    user: {
      select: {
        id: true,
        username: true,
      },
    },
  });

export const conversationPopulated =
  Prisma.validator<Prisma.ConversationInclude>()({
    participants: {
      include: participantPopulated,
    },
    latestMessage: {
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    },
  });

export default resolvers;
