const { GraphQLScalarType } = require('graphql')
const { CustomError } = require('../error.service')

const GraphQLURL = new GraphQLScalarType({
  name: 'URL',
  description: 'The URL scalar type represents URL addresses.',
  parseValue (value) {
    if (!isValid(value)) return new CustomError(4, 'Not a valid URL')
    return value
  },
  parseLiteral (ast) {
    if (!isValid(ast.value)) return new CustomError(4, 'Not a valid URL')
    return ast.value
  },
  serialize (value) {
    return value
  }
})

function isValid (value) {
  return /^((https?:)(\/\/\/?)([\w]*(?::[\w]*)?@)?([\d\w.-]+)(?::(\d+))?)?([/\\\w.()-]*)?(?:([?][^#]*)?(#.*)?)*/i.test(value)
}

module.exports = {
  GraphQLURL
}
