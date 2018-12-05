const { GraphQLScalarType } = require('graphql')
const { CustomError } = require('../error.service')

const GraphQLSlug = new GraphQLScalarType({
  name: 'Slug',
  description: 'The Slug scalar type represents a kebabCase string',
  parseValue (value) {
    if (!isValid(value)) return new CustomError(1, 'Not a valid Slug')
    return value
  },
  parseLiteral (ast) {
    if (!isValid(ast.value)) return new CustomError(1, 'Not a valid Slug')
    return ast.value
  },
  serialize (value) {
    return value
  }
})

function isValid (value) {
  return /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(value)
}

module.exports = {
  GraphQLSlug
}
