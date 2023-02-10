import { Prisma, PrismaClient } from "@prisma/client";
import { ISODateString } from "next-auth";
import { conversationPopulated, participantPopulated } from "../graphql/resolvers/conversation";
import {Context} from 'graphql-ws/lib/server'

import { PubSub } from "graphql-subscriptions";
import { messagePopulated } from "../graphql/resolvers/message";



/**Server Configuration */
export interface SubscriptionContext extends Context{
    connectionParams: {
        session?:Session
}
}



export interface GraphQLContext{
    session: Session | null;
    prisma: PrismaClient;
    pubsub: PubSub
    
}
/**Users */
export interface Session{
    user: User;
    expires: ISODateString;
}
export interface User{
    id: string;
    username: string;
    image: string;
    email: string;
    name: string;
    emailVerified: boolean;
}
export interface CreateUsernameResponse{
    success?: boolean;
    error?: string;
}

//Conversations

export type ConversationPopulated = Prisma.ConversationGetPayload<{ include: typeof conversationPopulated }>
export type ParticipantPopulated = Prisma.ConversationParticipantGetPayload<{ include: typeof participantPopulated }>
export interface ConversationUpdatedSubscriptionPayload{
    conversationUpdated: {
        conversation: ConversationPopulated;
         addedUserIds: Array<string>;
    removedUserIds: Array<string>;
    }
}
export interface ConversationDeletedSubscriptionPayload{
    conversationDeleted: ConversationPopulated;
    
}

//Messages
export interface SendMessageArguments{
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
}

export interface MessageSentSubscriptionPayload{
    messageSent: MessagePopulated;

}
export type MessagePopulated = Prisma.MessageGetPayload<{include:typeof messagePopulated}>