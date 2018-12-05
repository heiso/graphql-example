const config = require('config')
const { ApolloServer } = require('apollo-server-express')
const { mergeSchemas, schemaMutator } = require('./shared/graphql-tools')
const errorService = require('./shared/error.service')
const authenticationService = require('./shared/authentication.service')

const CONFIG = config.get('apollo')

const directives = [
  require('./shared/directives/extends.directive')
]

const schemas = [
  require('./+root/root.schema'),
  require('./+beer/beer.schema')
]

const { typeDefs, resolvers, schemaDirectives, dataSources } = mergeSchemas(schemas, directives)

const server = new ApolloServer({
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

schemaMutator(server.schema, [
  errorService.fieldMutator,
  authenticationService.fieldMutator
])

module.exports = {
  server
}
