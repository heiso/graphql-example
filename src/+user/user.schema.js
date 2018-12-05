const { gql } = require('apollo-server')
const { UserDataSource } = require('./user.model')

const typeDefs = gql`
  type User @extends(type: "Resource") {
    firstname: String
    lastname: String
    email: Email
    sessions: [Session]
  }

  type Session {
    userAgent: String
    loggedAt: String
  }

  input UpdateMeInput {
    firstname: String
    lastname: String
  }

  input CreateUserInput {
    email: Email!
    firstname: String!
    lastname: String!
  }
  
  extend type Query {
    getMe: User
  }

  extend type Mutation {
    updateMe(input: UpdateMeInput!): User
    createUser(input: CreateUserInput!): User @hasRole(role: "organizationOwner")
    login(email: Email!, password: Password!): User @isPublic
    logout: User
  }
`

const resolvers = {
  Query: {
    async getMe (parent, args, { dataSources }) {
      return dataSources.user.getMe()
    }
  },
  User: {
    async sessions (parent, args, { dataSources }) {
      return dataSources.user.getSessions()
    }
  },
  Mutation: {
    async updateMe (parent, { input }, { dataSources }) {
      return dataSources.user.updateMe(input)
    },
    async createUser (parent, { input }, { dataSources }) {
      return dataSources.user.create(input)
    },
    async login (parent, { email, password }, { dataSources }) {
      return dataSources.user.login(email, password)
    },
    async logout (parent, args, { dataSources }) {
      return dataSources.user.logout()
    }
  }
}

module.exports = {
  typeDefs,
  resolvers,
  dataSources: {
    user: UserDataSource
  }
}
