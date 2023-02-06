import userResovlers from './user';
import merge from 'lodash.merge';
//merge all the resolver in single object
const resolvers = merge({},userResovlers)

export default resolvers;