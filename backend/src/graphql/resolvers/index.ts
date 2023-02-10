import userResovlers from './user';
import merge from 'lodash.merge';
import conversationResolver from './conversation';
import scalarResolvers from './scalar'
//merge all the resolver in single object
import messageResolver from './message';
const resolvers = merge({},userResovlers,conversationResolver,messageResolver,scalarResolvers);

export default resolvers;