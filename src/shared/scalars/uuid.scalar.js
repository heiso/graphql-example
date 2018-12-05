const { GraphQLScalarType } = require('graphql')
const { CustomError } = require('../error.service')

const GraphQLUUID = new GraphQLScalarType({
  name: 'UUID',
  description: 'The UUID scalar type represents a UUID.',
  parseValue (value) {
    if (!isValid(value)) return new CustomError(5, 'Not a valid UUID')
    return value
  },
  parseLiteral (ast) {
    if (!isValid(ast.value)) return new CustomError(5, 'Not a valid UUID')
    return ast.value
  },
  serialize (value) {
    return value
  }
})

function isValid (value) {
  return /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(value)
}

module.exports = {
  GraphQLUUID
}
