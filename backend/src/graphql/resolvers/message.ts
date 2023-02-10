import { GraphQLError } from "graphql/error";
import { GraphQLContext, MessagePopulated, MessageSentSubscriptionPayload, SendMessageArguments } from "../../util/types";
import { Prisma } from "@prisma/client";
import { withFilter } from "graphql-subscriptions";
import { ConversationCreatedSubscriptionPayload, conversationPopulated } from "./conversation";
import { userIsConversationParticipant } from "../../util/functions";

const resolver = {
    Query: {
        messages: async function (_: any, args: { conversationId: string }, context: GraphQLContext): Promise<Array<MessagePopulated>>{
            const { session, prisma } = context;
            const { conversationId } = args;
            if (!session?.user) {
                throw new Error("Not Authorized");

            }
            const { user: { id: userId } } = session
            /**Verifiy that user is a participant and conversation is exist*/
            const conversation = await prisma.conversation.findUnique({
                where: {
                    id: conversationId,
                    
                },
                include:conversationPopulated
            })
            if (!conversation) {
                throw new GraphQLError("Conversation not Found")
            }
            const allowedToView = userIsConversationParticipant(conversation.participants, userId)
            if (!allowedToView) {
                throw new GraphQLError("Not Authorized")

            }
            try {
                const messages = await prisma.message.findMany({
                    where: {
                        conversationId
                    },
                    include: messagePopulated,
                    orderBy: {
                        createdAt: "desc"
                    }
                });
                return messages
            } catch (error: any) {
                console.log("message error", error);
                throw new GraphQLError(error?.message)
            }
            
}
    },
    Mutation: {
        sendMessage: async function (_: any, args: SendMessageArguments, context: GraphQLContext): Promise<boolean>{
            const { session, prisma, pubsub } = context;
            
            const { id: messageId, senderId, conversationId, body } = args
            
            if (!session?.user) {
                throw new GraphQLError("Not authorized")
            }
            const { id: userId } = session.user;
            if (userId !== senderId) {
            throw new GraphQLError("Not authorized")
                
            }
            
            try {
                /**Create new Message entity */
                const newMessage = await prisma.message.create({
                    data: {
                        id: messageId,
                        senderId,
                        conversationId,
                        body
                    },
                    include:messagePopulated
                })
                /**find conversationParticipant entity */
                const participant = await prisma.conversationParticipant.findFirst({
                    where: {
                        userId,
                        conversationId
                    }
                })
                


/*Should always exists*/

                if (!participant) {
                    throw new GraphQLError("participant does not exist")
    
}
                const { id: participantId } = participant;

                /**Update conversation entity */
                const conversation = await prisma.conversation.update({
                    where: {
                        id: conversationId,
                    },
                    data: {
                        latestMessageId: newMessage.id,
                        participants: {
                            update: {
                                where: {
                                    id:participantId
                                },
                                data: {
                                    hasSeenLatestMessage:true //who sent the message has read the message
                                }
                            },
                            updateMany: {
                                where: {
                                    NOT: {
                                        userId
                                    }
                                },
                                data: {
                                    hasSeenLatestMessage:false
                                }
                            }
                        }
                    },
                    include:conversationPopulated
                })

                pubsub.publish('MESSAGE_SENT', { messageSent: newMessage });
                pubsub.publish("CONVERSATION_UPDATED", {
                    conversationUpdated: {
                    conversation,
                    }
                })
                return true
            } catch (error) {
                console.log("Send Message Error")
                throw new GraphQLError('Error sending message');
                
            }
            
        }
    },
    Subscription: {
        messageSent: {
            subscribe: withFilter((_: any, __: any, context: GraphQLContext) => {
                const { pubsub } = context
                return pubsub.asyncIterator(['MESSAGE_SENT']);
            }, (payload: MessageSentSubscriptionPayload,args:{conversationId:string}, context: GraphQLContext) => {
                return payload.messageSent.conversationId===args.conversationId
              })
        }




    }
}

export const messagePopulated = Prisma.validator<Prisma.MessageInclude>()({
    sender: {
        select: {
            id: true,
            username:true
        }
    }
})
export default resolver;