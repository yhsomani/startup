/**
 * GraphQL API Layer
 *
 * Provides flexible querying, schema stitching for polyglot microservices,
 * and real-time subscriptions.
 */

const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const { ApolloServerPluginDrainHttpServer } = require("@apollo/server/plugin/drainHttpServer");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");

const typeDefs = require("./graphql/type-defs");
const resolvers = require("./graphql/resolvers");

class GraphQLService {
    constructor(options = {}) {
        this.port = options.port || 4000;
        this.schema = null;
        this.server = null;
    }

    async initialize(httpServer) {
        this.schema = makeExecutableSchema({ typeDefs, resolvers });

        const wsServer = new WebSocketServer({
            server: httpServer,
            path: "/graphql",
        });

        const serverCleanup = useServer({ schema: this.schema }, wsServer);

        this.server = new ApolloServer({
            schema: this.schema,
            plugins: [
                ApolloServerPluginDrainHttpServer({ httpServer }),
                {
                    async serverWillStart() {
                        return {
                            async drainServer() {
                                await serverCleanup.dispose();
                            },
                        };
                    },
                },
            ],
            context: async ({ req }) => ({
                token: req.headers.authorization,
                user: await this.authenticate(req.headers.authorization),
            }),
        });

        await this.server.start();

        return this.server;
    }

    async authenticate(token) {
        if (!token) return null;

        try {
            const jwt = require("jsonwebtoken");
            const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
            return decoded;
        } catch (error) {
            return null;
        }
    }

    getMiddleware() {
        return expressMiddleware(this.server, {
            context: async ({ req }) => ({
                token: req.headers.authorization,
                user: req.user,
            }),
        });
    }
}

const graphqlService = new GraphQLService();

module.exports = {
    GraphQLService,
    graphqlService,
};
