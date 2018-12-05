const { GraphQLScalarType } = require('graphql')
const { CustomError } = require('../error.service')

const GraphQLEmail = new GraphQLScalarType({
  name: 'Email',
  description: 'The Email scalar type represents E-Mail addresses compliant to RFC 822.',
  parseValue (value) {
    if (!isValid(value)) return new CustomError(3, 'Not a valid Email address')
    return value
  },
  parseLiteral (ast) {
    if (!isValid(ast.value)) return new CustomError(3, 'Not a valid Email address')
    return ast.value
  },
  serialize (value) {
    return value
  }
})

function isValid (value) {
  return /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i.test(value)
}

module.exports = {
  GraphQLEmail
}
