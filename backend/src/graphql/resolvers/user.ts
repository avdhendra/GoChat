//resolver can be three things
//Query resolver
//mutation resolver
//subscription resolver

import { ApolloError } from "apollo-server-core";
import { CreateUsernameResponse, User } from "../../util/types";

//resolver fullfill the request 
const resolvers = {
    Query: {
        searchUsers:async (_: any, args: { username: string }, context: any):Promise<Array<User>> => {
            const { username: searchedUsername } = args;
            const { session, prisma } = context;
            if (!session?.user) {
                throw new ApolloError('Not Authorized');
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
                throw new ApolloError(error?.message)
            }
}
    },

    Mutation: {
        createUsername: async (_: any, args: { username: string }, context: any):Promise<CreateUsernameResponse> => {
            
            const { username } = args;
            const { session, prisma } = context;
            if (!session?.user) {
                return {
                    error:"Not Authorized"
                }
            }
            const { id:userId } = session.user;
            try {
                /**Check that username is not taken */

                const existingUser = await prisma.user.findUnique({
                    where: {
                        username,
                        
                    }
                })
                if (existingUser) {
                    return {
                        error:"Username already taken .Try another"
                    }

                }

                await prisma.user.update({
                    where: {
                        id:userId
                    },
                    data: {
                        username
                    }
                })
                /**
                 * Update user
                 *  
                 * 
                 */
                return { success: true };
            } catch (error:any) {
                console.log("createUsername,error", error);
                return {
                    error:error?.message
                }
            }


}
    },
    // Subscription: {
        
    // }
}
export default resolvers