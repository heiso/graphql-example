const _ = require('lodash')
const { GraphQLScalarType } = require('graphql')
const { CustomErrorSet } = require('../error.service')

const ALPHANUMERIC_REGEX = /^(?=.*[0-9])(?=.*[a-zA-Z])(.+)$/

const GraphQLPassword = new GraphQLScalarType({
  name: 'Password',
  description: 'The Password scalar type represents a complex password.',
  parseValue (value) {
    const validationErrorSet = check(value)
    return (validationErrorSet.isEmpty()) ? value : validationErrorSet
  },
  parseLiteral (ast) {
    const validationErrorSet = check(ast.value)
    return (validationErrorSet.isEmpty()) ? ast.value : validationErrorSet
  },
  serialize (value) {
    return value
  }
})

function check (value) {
  const validationErrorSet = new CustomErrorSet()
  if (!_.isString(value)) {
    validationErrorSet.add('v0010', 'Password should be a string')
  } else {
    if (value.length < 8 || value.length > 48) {
      validationErrorSet.add('v0011', 'Password should be a string with a lenght between 8 and 48 characters')
    }
    if (!ALPHANUMERIC_REGEX.test(value)) {
      validationErrorSet.add('v0012', 'String must contain at least one number and one letter')
    }
  }
  return validationErrorSet
}

module.exports = {
  GraphQLPassword
}
