const _ = require('lodash')

function expressErrorHandler (err, req, res, next) {
  console.error(err)
  if (err instanceof CustomError || err instanceof CustomErrorSet) {
    if (err.id === '401' || err.id === '100') res.status(401)
    if (err.id === '403') res.status(403)
    res.send(err)
  } else {
    res.status(500).send({ error: 'Interval Server Error' })
  }
  return err
}

function graphqlErrorHandler (err) {
  if (err.originalError instanceof CustomError) {
    if (!err.originalError.path) err.originalError.path = err.path
    console.error(err.originalError, err.originalError.err)
    return err.originalError
  } else {
    console.error(err.originalError)
    return err
  }
}

function fieldMutator (field, parentType) {
  const { resolve } = field
  if (resolve) {
    field.resolve = async (parent, args, context, astNode) => {
      const validationErrorSet = _getValidationErrorsRecurs(args, context, astNode)
      if (!validationErrorSet.isEmpty()) throw validationErrorSet
      return resolve.apply(resolve, [parent, args, context, astNode])
    }
  }
}

function _getValidationErrorsRecurs (args, context, astNode, path = [], errorSet = new CustomErrorSet()) {
  if (path.length === 0 && astNode.path && astNode.path.key) path.push(astNode.path.key)
  _.each(args, (arg, name) => {
    if (arg instanceof CustomError || arg instanceof CustomErrorSet) {
      arg.path = path.concat([name])
      errorSet.add(arg)
    } else if (!_.isString(arg) && !_.isEmpty(arg)) {
      path.push(name)
      _getValidationErrorsRecurs(arg, context, astNode, path, errorSet)
    }
  })
  return errorSet
}

class CustomError extends Error {
  constructor (id, message, err) {
    super()
    this.id = id.toString()
    this.message = message
    this.path = null
    this.err = err
  }
}

class CustomErrorSet extends Error {
  constructor () {
    super()
    this._errors = []
  }

  set path (path) {
    this._errors.forEach((error) => { error.path = path })
  }

  // HACK: appolo-server will check if throwed error has an errors property and will iterate over it.
  // Here we provide this errors property with mocked Errors and the originalError populated.
  // By doing this we can pass in the errorFormatter for each errors in our CustomErrorSet and get a flattened errors object in response.
  get errors () {
    return this._errors.map((error) => {
      const err = new Error()
      err.originalError = error
      return err
    })
  }

  add (idOrError, message) {
    if (idOrError instanceof CustomError) this._errors.push(idOrError)
    else if (idOrError instanceof CustomErrorSet) idOrError._errors.forEach((error) => this.add(error))
    else this._errors.push(new CustomError(idOrError, message))
  }

  isEmpty () {
    return this._errors.length === 0
  }
}

module.exports = {
  fieldMutator,
  expressErrorHandler,
  graphqlErrorHandler,
  CustomError,
  CustomErrorSet
}
