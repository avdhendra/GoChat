import { gql } from "apollo-server-core";

const typeDefs = gql`

scalar Date

type Mutation{
    createConversation(participantIds:[String]):CreateConversationResponse
}
type CreateConversationResponse{
    conversationId:String
}
type Conversation{
    id:String
   # latestMessage:String
    participants:[Participant]
    createdAt:Date
    updateAt:Date
}
type Query{
    conversations:[Conversation]
}
type Participant{
    id:String
    user:User
    hasSeenLatestMessage:Boolean 
}

`
export default typeDefs