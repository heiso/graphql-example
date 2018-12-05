const { gql, SchemaDirectiveVisitor } = require('apollo-server')
const { defaultFieldResolver } = require('graphql')
const { hasRoles } = require('../authorization.service')
const { CustomError } = require('../error.service')

const typeDefs = gql`
  directive @hasRole(role: JSON!) on FIELD_DEFINITION
`

class HasRoleDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async (parent, args, context, astNode) => {
      const { roles } = context.req.user
      const isAuthorized = hasRoles(roles, this.args.role)
      if (!isAuthorized) throw new CustomError(403, 'Not Authorized', context)
      return resolve.apply(resolve, [parent, args, context, astNode])
    }
  }
}

module.exports = {
  typeDefs,
  schemaDirectives: {
    hasRole: HasRoleDirective
  }
}
