import userResovlers from './user';
import merge from 'lodash.merge';
import conversationResolver from './conversation';
//merge all the resolver in single object
const resolvers = merge({},userResovlers,conversationResolver);

export default resolvers;