const { gql } = require('apollo-server')

const typeDefs = gql`
  type Beer @extends(type: "Resource") {
    name: String
    brewery: Brewery
  }

  input CreateBeerInput {
    name: String!
    brewery: ID!
  }

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
    getBeer(id: ID!): Beer
    getBeers: [Beer]
    getBrewery(id: ID!): Brewery
    getBreweries: [Brewery]
  }

  extend type Mutation {
    createBeer(input: CreateBeerInput!): Beer
    drinkBeer(id: ID!): String
    createBrewery(input: CreateBreweryInput!): Brewery
  }
`

const resolvers = {
  Query: {
    async getBeer (parent, args, { models }) {
      return models.beer.get(args)
    },
    async getBeers (parent, args, { models }) {
      return models.beer.list(args)
    },
    async getBrewery (parent, args, { models }) {
      return models.brewery.get(args)
    },
    async getBreweries (parent, args, { models }) {
      return models.brewery.list(args)
    }
  },
  Beer: {
    async brewery (parent, args, { models }) {
      return models.brewery.get(parent.brewery)
    }
  },
  Brewery: {
    async beers (parent, args, { models }) {
      return models.beer.toMany(parent, 'id', 'brewery', args)
    }
  },
  Mutation: {
    async createBeer (parent, { input }, { models }) {
      return models.beer.create(input)
    },
    async drinkBeer (parent, { id }, { models }) {
      return models.beer.drink(id)
    },
    async createBrewery (parent, { input }, { models }) {
      return models.brewery.create(input)
    }
  }
}

module.exports = {
  typeDefs,
  resolvers
}
