const { gql } = require('apollo-server')
const { beerModel } = require('../+beer/beer.model')
const { breweryModel } = require('./brewery.model')

const typeDefs = gql`
  type Brewery @extends(type: "Resource") {
    name: String
    location: String
    beers: [Beer]
  }

  input CreateBreweryInput {
    name: String!
    location: String
  }
  
  extend type Query {
    getBrewery(id: ID!): Brewery
    getBreweries: [Brewery]
  }

  extend type Mutation {
    createBrewery(input: CreateBreweryInput!): Brewery
  }
`

const resolvers = {
  Query: {
    async getBrewery (parent, args, context) {
      return breweryModel.get(args, context)
    },
    async getBreweries (parent, args, context) {
      return breweryModel.list(args, context)
    }
  },
  Brewery: {
    async beers (parent, args, context) {
      return beerModel.toMany(parent, 'id', 'brewery', args, context)
    }
  },
  Mutation: {
    async createBrewery (parent, {input}, context) {
      return breweryModel.create(input, context)
    }
  }
}

module.exports = {
  typeDefs,
  resolvers
}
