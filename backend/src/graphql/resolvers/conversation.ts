import { GraphQLError } from "graphql";
import { ConversationDeletedSubscriptionPayload, ConversationPopulated, ConversationUpdatedSubscriptionPayload, GraphQLContext } from "../../util/types";
import { Prisma } from "@prisma/client";
import { withFilter } from "graphql-subscriptions/dist/with-filter";
import { userIsConversationParticipant } from "../../util/functions";

const resolvers = {
  Query: {
    conversations: async function (_: any, __: any, context: GraphQLContext): Promise<Array<ConversationPopulated>> {
      //console.log("Conversation Query");

      const { session, prisma } = context
      if (!session?.user) {
        throw new GraphQLError('Not Authorized')
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
          include: conversationPopulated
        })
        //find all the conversation that user is not part of
        return conversations.filter(conversation => !!conversation.participants.find(p => p.userId === userId))
        
      } catch (error: any) {
        console.log('conversation error', error)
        throw new GraphQLError(error?.message)
      }

    },
  },
  Mutation: {
    createConversation: async (
      _: any,
      args: { participantIds: Array<string> },
      context: GraphQLContext
    ): Promise<{ conversationId: string }> => {
      const { session, prisma, pubsub } = context;
      const { participantIds } = args;
      if (!session?.user) {
        throw new GraphQLError("No Authorization");
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
        pubsub.publish('CONVERSATION_CREATED', {
          conversationCreated: conversation
        })
        return {
          conversationId: conversation.id,
        };
      } catch (error: any) {
        throw new GraphQLError("Error creating conversation");
      }
    },
    markConversationAsRead: async function (_: any, args: { userId: string, conversationId: string }, context: GraphQLContext): Promise<boolean> {
      const { session, prisma } = context;
      const { userId, conversationId } = args;
      
      if (!session?.user) {
        throw new GraphQLError("NOT authorized")
      }
      try {

        const participant = await prisma.conversationParticipant.updateMany({
          where: {
            userId, conversationId
          },
          data: {
            hasSeenLatestMessage: true
          }
        })
        
        /**Should always exists but being safe */

       
        return true
      } catch (error: any) {
        throw new GraphQLError(error?.message);
      }
    

      
    },
    deleteConversation: async function (_: any, args: { conversationId: string }, context: GraphQLContext): Promise<boolean> {
     
      const { session, prisma, pubsub } = context
      const { conversationId } = args
      if (!session?.user) {
        throw new GraphQLError("NOT Authorized");
      }
      try {
        //delete conversation,message,participant
        const [deleteConversation] = await prisma.$transaction([prisma.conversation.delete({
          where: {
            id: conversationId,
          }, include: conversationPopulated
        }), prisma.conversationParticipant.deleteMany({
          where: {
            conversationId
          }
        }), prisma.message.deleteMany({
          where: {
            conversationId,
          }
        })])

        pubsub.publish('CONVERSATION_DELETED', {
          conversationDeleted: deleteConversation
        })
        return true
      } catch (error: any) {
        throw new GraphQLError("Failed to delete Conversation")
      }
     
     
    },

    updateParticipants: async function (
      _: any,
      args: { conversationId: string, participantIds: Array<string> },
      context: GraphQLContext): Promise<boolean> {
      const { session, prisma, pubsub } = context;
      const { conversationId, participantIds } = args;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      const {
        user: { id: userId },
      } = session;

      try {
        const participants = await prisma.conversationParticipant.findMany({
          where: {
            conversationId,
          },
        });
        const existingParticipants = participants.map((p) => p.userId);

        const participantsToDelete = existingParticipants.filter(
          (id) => !participantIds.includes(id)
        );
        const participantsToCreate = participantIds.filter(
          (id) => !existingParticipants.includes(id)
        );
        const transactionStatements = [
          prisma.conversation.update({
            where: {
              id: conversationId,
            },
            data: {
              participants: {
                deleteMany: {
                  userId: {
                    in: participantsToDelete,
                  },
                  conversationId,
                },
              },
            },
            include: conversationPopulated,
          }),
        ];

        if (participantsToCreate.length) {
          transactionStatements.push(
            prisma.conversation.update({
              where: {
                id: conversationId,
              },
              data: {
                participants: {
                  createMany: {
                    data: participantsToCreate.map((id) => ({
                      userId: id,
                      hasSeenLatestMessage: true,
                    })),
                  },
                },
              },
              include: conversationPopulated,
            })
          );
        }
        const [deleteUpdate, addUpdate] = await prisma.$transaction(
          transactionStatements
        );

        pubsub.publish("CONVERSATION_UPDATED", {
          conversationUpdated: {
            conversation: addUpdate || deleteUpdate,
            addedUserIds: participantsToCreate,
            removedUserIds: participantsToDelete,
          },
        });

        return true;
      } catch (error: any) {
        console.log("updateParticipants error", error);
        throw new GraphQLError(error?.message);
      }
    }


  },

  Subscription: {
    //every time pubsub published
    conversationCreated: {
      // subscribe: (_: any, __: any, context: GraphQLContext) => {
      //   const { pubsub } = context
      //  return  pubsub.asyncIterator(['CONVERSATION_CREATED']) 
      //   //when createConversation mutation fired Conversation_Created publish with payload 
      //   //this subscription is listening to conversation_created event this is fired every time 
      // }
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
         const { pubsub } = context
        return  pubsub.asyncIterator(['CONVERSATION_CREATED']) 
         //when createConversation mutation fired Conversation_Created publish with payload 
         //this subscription is listening to conversation_created event this is fired every time 
        }, (payload: ConversationCreatedSubscriptionPayload, _, context: GraphQLContext) => {
          const { session } = context;
         
          if (!session?.user) {
            throw new GraphQLError("Not Authorized");
         }
         const { id: userId } = session.user;
          const { conversationCreated: { participants } } = payload
         
         
         
        
          const userIsParticipant = userIsConversationParticipant(participants, userId);
         
         
          return userIsParticipant;
       }
      )
    },
    conversationUpdated: {
      subscribe: withFilter((_: any, __: any, context: GraphQLContext) => {
        const { pubsub } = context
        return pubsub.asyncIterator(['CONVERSATION_UPDATED'])
      },
      (payload: ConversationUpdatedSubscriptionPayload, _:any,context:GraphQLContext) => {
        
          const { session } = context;
         
          if (!session?.user) {
            throw new GraphQLError("Not Authorized");
        }
        const {id:userId}=session.user
        const { conversationUpdated: { conversation:{participants} ,addedUserIds,removedUserIds} } = payload;
      
      const userIsParticipant = userIsConversationParticipant(
            participants,
            userId
          );

          const userSentLatestMessage =
            payload.conversationUpdated.conversation.latestMessage?.senderId ===
            userId;

          const userIsBeingRemoved =
            removedUserIds &&
            Boolean(removedUserIds.find((id) => id === userId));

       return (
            (userIsParticipant && !userSentLatestMessage) ||
            userSentLatestMessage ||
            userIsBeingRemoved
          );
      
        
      }
      ),
      
    }, conversationDeleted: {
      subscribe: withFilter((_: any, __: any, context: GraphQLContext)=> {
  const { pubsub } = context;
  return pubsub.asyncIterator(['CONVERSATION_DELETED'])
     
}, (payload:ConversationDeletedSubscriptionPayload,_:any,context:GraphQLContext) => {
        const { session } = context;
        if (!session?.user) {
          throw new GraphQLError('NOt Authorized')

        }
        const { id: userId } = session.user;
        const{conversationDeleted:{participants}}=payload

        return userIsConversationParticipant(participants,userId)
        
      })
    }
  }
};


export interface ConversationCreatedSubscriptionPayload{
  conversationCreated:ConversationPopulated
}




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
