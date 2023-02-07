import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from 'graphql-ws';
import { getSession } from "next-auth/react";
//graphql endpoint
//graphql has only one endpoint 
const httpLink = new HttpLink({
    uri: 'http://localhost:4000/',
    credentials:"include"
});

const wsLink = typeof window !== 'undefined' ? new GraphQLWsLink(createClient({
    url: 'ws://localhost:4000/subscriptions',
    connectionParams:async()=>( {
      session:await getSession()  
    }),
})) : null //websocket not available in nextjs server
//we that ensure the we are not in next jsserver

const splitLink = typeof window!=='undefined'&& wsLink!=null? split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
):httpLink




export const client = new ApolloClient({
    link:splitLink,
    cache: new InMemoryCache(), //it has inbuilt caching the query
});
