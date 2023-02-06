import { gql } from "apollo-server-core";
//scehma
const typeDefs = gql`
type SearchedUser{
    id:String
    username:String
    banned:Boolean
}
#reading the from the database for user
type Query{
    searchUsers(username:String):[SearchedUser]
}
#creating and deleting and updation in mutation
type Mutation{
createUsername(username:String):CreateUsernameResponse

}
type CreateUsernameResponse{
    success:Boolean
    error:String
}
`
export default typeDefs;