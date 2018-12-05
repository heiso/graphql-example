const { gql, SchemaDirectiveVisitor } = require('apollo-server')

const typeDefs = gql`
  directive @extends(type: String!) on OBJECT
`

class ExtendsDirective extends SchemaDirectiveVisitor {
  visitObject (type) {
    const { type: parentType } = this.args
    if (!this.schema.getType(parentType)) {
      throw new Error(`${this.visitedType} is trying to extends an undefined type named "${parentType}"`)
    }
    const parentTypeAstNode = this.schema.getType(parentType)
    const parentFields = parentTypeAstNode.getFields()
    type._fields = {
      ...parentFields,
      ...type._fields
    }
  }
}

module.exports = {
  typeDefs,
  schemaDirectives: {
    extends: ExtendsDirective
  }
}
