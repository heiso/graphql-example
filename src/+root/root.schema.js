const { gql } = require('apollo-server')
const GraphQLJSON = require('graphql-type-json')
const { version } = require('../../package.json')

const typeDefs = gql`
  type Query {
    version: String
  }

  type Mutation {
    noop(bool: Boolean): Boolean
  }

  type Resource {
    id: ID
    createdAt: String
    updatedAt: String
  }

  scalar JSON

  schema {
    query: Query
    mutation: Mutation
  }
`

const resolvers = {
  Query: {
    version: () => version
  },
  Mutation: {
    noop: (parent, args, context) => args.bool
  },
  JSON: GraphQLJSON
}

module.exports = {
  typeDefs,
  resolvers
}
