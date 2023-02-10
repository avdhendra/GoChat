import { ApolloServer } from '@apollo/server';
//import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageLocalDefault } from 'apollo-server-core';
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from 'express';
import http from 'http';
import { expressMiddleware } from "@apollo/server/express4";
import { json } from "body-parser";
import { makeExecutableSchema } from '@graphql-tools/schema'
import typeDefs from './graphql/typeDefs';
import resolvers from './graphql/resolvers';
import { getSession } from 'next-auth/react'
import * as dotenv from 'dotenv';
import { GraphQLContext, Session, SubscriptionContext } from './util/types';
import { PrismaClient } from '@prisma/client';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';
import cors from 'cors'
async function main() {
  dotenv.config()
  // Required logic for integrating with Express
  const app = express();
  // Our httpServer handles incoming requests to our Express app.
  // Below, we tell Apollo Server to "drain" this httpServer,
  // enabling our servers to shut down gracefully.
  const httpServer = http.createServer(app);

// Creating the WebSocket server
const wsServer = new WebSocketServer({
  // This is the `httpServer` we created in a previous step.
  server: httpServer,
  // Pass a different path here if app.use
  // serves expressMiddleware at a different path
  path: '/subscriptions',
});

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  })
  const prisma = new PrismaClient()
  const pubsub = new PubSub();



  const serverCleanup = useServer({
    schema, context:async (ctx: SubscriptionContext): Promise<GraphQLContext> => {
      if (ctx.connectionParams && ctx.connectionParams.session) {
        const { session } = ctx.connectionParams;
       return {session,prisma,pubsub}

      }
      return{session:null,prisma,pubsub}
} }, wsServer);
  



  

  // Same ApolloServer initialization as before, plus the drain plugin
  // for our httpServer.
  const server = new ApolloServer({
    schema,
    csrfPrevention:true,
    // context: async ({ req, res }): Promise<GraphQLContext> => {
    //   const session = await getSession({ req }) as Session;
    //   //console.log("CONTEXT SESSION", session)
    //   return { session,prisma,pubsub}
    // },
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ]
      
  });

  // More required logic for integrating with Express
  await server.start();
  const corsOptions = {
    origin: process.env.CLIENT_ORIGIN,
    credentials: true, //allow to server to access the authorization header
  }
  app.use(
    "/",
    cors<cors.CorsRequest>(corsOptions),
    json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        const session = await getSession({ req })
       return{session:session as Session,prisma,pubsub} 
      }
    })
  )

  const PORT = 4000;
  // Modified server startup
  // Now that our HTTP server is fully set up, we can listen to it.
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );
  console.log(`Server is now running on http://localhost:${PORT}/
  `);
}
main().catch((err) => console.log(err))