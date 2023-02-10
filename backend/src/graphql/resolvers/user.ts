//resolver can be three things
//Query resolver
//mutation resolver
//subscription resolver

import { GraphQLError } from "graphql";
import { User } from "@prisma/client";
import { verifyAndCreateUsername } from "../../util/functions";
import { CreateUsernameResponse, GraphQLContext } from "../../util/types";

//resolver fullfill the request 
const resolvers = {
    Query: {
        searchUsers:async (_: any, args: { username: string }, context: any):Promise<Array<User>> => {
            const { username: searchedUsername } = args;
            const { session, prisma } = context;
            if (!session?.user) {
                throw new GraphQLError('Not Authorized');
            }
            const { user: { username: myUsername } } = session;
            try {
                //exclude self from search for users
                const users = await prisma.user.findMany({
                    where: {
                        username: {
                            contains: searchedUsername,
                            not: myUsername,
                            mode:'insensitive'
                        }
                    }
                })
                return users;
            } catch (error: any) {
                console.log("Search users error", error)
                throw new GraphQLError(error?.message)
            }
}
    },

    Mutation: {
        createUsername: async (_: any, args: { username: string }, context:GraphQLContext):Promise<CreateUsernameResponse> => {
            
            const { username } = args;
            const { session, prisma } = context;
            if (!session?.user) {
                return {
                    error:"Not Authorized"
                }
            }
            const { id: userId } = session.user;
            
          

return await verifyAndCreateUsername({userId:userId,username},prisma)
}
    },
   
}
export default resolvers