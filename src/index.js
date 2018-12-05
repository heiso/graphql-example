const config = require('config')
const express = require('express')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const { ApolloServer } = require('apollo-server-express')
const { PostgresqlConnector } = require('./shared/connectors/postgresql.connector')
const { RedisConnector } = require('./shared/connectors/redis.connector')
const { mergeSchemas, schemaMutator } = require('./shared/graphql-tools')
const errorService = require('./shared/error.service')
const authenticationService = require('./shared/authentication.service')

const CONFIG = config.get('express')

const directives = [
  require('./shared/directives/extends.directive')
]

const schemas = [
  require('./+root/root.schema'),
  require('./+beer/beer.schema')
]

const models = {
  beer: require('./+beer/beer.model'),
  brewery: require('./+beer/brewery.model')
}

const { typeDefs, resolvers, schemaDirectives, dataSources } = mergeSchemas(schemas, directives)

const graphqlServer = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives,
  dataSources,
  context: (context) => context,
  tracing: CONFIG.tracing,
  engine: CONFIG.engine,
  cors: CONFIG.cors,
  formatError: errorService.graphqlErrorHandler
})

schemaMutator(graphqlServer.schema, [
  errorService.fieldMutator,
  authenticationService.fieldMutator
])

const app = express()

app.use(helmet())
app.use(helmet.noCache())
app.use(cookieParser())
app.use(authenticationService.expressMiddleware)

graphqlServer.applyMiddleware({ app })

app.use(errorService.expressErrorHandler)

app.use((req, res, next) => {
  req.connectors = {
    postgresql: new PostgresqlConnector(config.get('connectors.postgresql')),
    redis: new RedisConnector(config.get('connectors.redis'))
  }

  req.models =
  next()
})

app.listen(CONFIG.port, () => {
  console.log(`🚀 Server running`)
})
