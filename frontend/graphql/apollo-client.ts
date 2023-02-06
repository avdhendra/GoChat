import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
//graphql endpoint
//graphql has only one endpoint 
const httpLink = new HttpLink({
    uri: 'http://localhost:4000/',
    credentials:"include"
});

export const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(), //it has inbuilt caching the query
});
