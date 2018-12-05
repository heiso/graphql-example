const _ = require('lodash')

function mergeSchemas (schemas = [], directives = []) {
  const directivesAndSchemas = [...directives, ...schemas]
  return {
    typeDefs: directivesAndSchemas.reduce((acc, { typeDefs }) => {
      if (typeDefs) acc.push(typeDefs)
      return acc
    }, []),
    resolvers: directivesAndSchemas.reduce((acc, { resolvers }) => {
      if (resolvers) acc.push(resolvers)
      return acc
    }, []),
    schemaDirectives: directivesAndSchemas.reduce((acc, { schemaDirectives }) => {
      acc = {
        ...acc,
        ...schemaDirectives
      }
      return acc
    }, {}),
    dataSources: () => {
      return directivesAndSchemas.reduce((acc, { dataSources }) => {
        if (dataSources) {
          Object.entries(dataSources).forEach(([name, DataSource]) => {
            acc[name] = new DataSource()
          })
        }
        return acc
      }, {})
    }
  }
}

function schemaMutator (schema, fieldMutators) {
  if (!(fieldMutators instanceof Array)) {
    fieldMutators = [fieldMutators]
  }
  _.each(schema.getTypeMap(), (type) => {
    if (!type.name.startsWith('__') && type.getFields) {
      _.each(type.getFields(), (field) => {
        _.eachRight(fieldMutators, (fieldMutator) => {
          fieldMutator(field, type)
        })
      })
    }
  })
  return schema
}

module.exports = {
  mergeSchemas,
  schemaMutator
}
