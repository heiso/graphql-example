const { gql, SchemaDirectiveVisitor } = require('apollo-server')

const typeDefs = gql`
  directive @isPublic on FIELD_DEFINITION
`

class IsPublicDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field) {
  }
}

module.exports = {
  typeDefs,
  schemaDirectives: {
    isPublic: IsPublicDirective
  }
}
