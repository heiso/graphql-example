const _ = require('lodash')
const config = require('config')
const { getSession, keepAliveSession } = require('./session.service')
const { CustomError } = require('./error.service')
const { UserDataSource } = require('../+user/user.model')

const SESSION_COOKIE_NAME = config.get('session').cookieName

async function expressMiddleware (req, res, next) {
  try {
    const context = { req, res }

    // if cookie is set, it might be a request from a logged in user
    if (req.cookies[config.sessionCookieName]) await authenticateUser(context)

    return next()
  } catch (err) {
    return next(err)
  }
}

async function authenticateUser (context) {
  if (context.req.cookies[SESSION_COOKIE_NAME]) {
    const token = context.req.cookies[SESSION_COOKIE_NAME]

    // get session
    const session = await getSession(token, context)

    // if session found, get user
    const userDataSource = new UserDataSource()
    userDataSource.initialize({ context })
    const [user, roles] = await Promise.all([
      userDataSource.get(session.userId),
      userDataSource.getRoles(session.userId)
    ])

    // if session found, populate context
    if (user) {
      context.req.user = { ...user, roles, token }
      // if session found, renew cookie validity
      if (['GET', 'OPTIONS'].includes(context.req.method)) {
        keepAliveSession(context)
      }
    }
  }
}

function fieldMutator (field, parentType) {
  const { resolve, astNode } = field
  const hasIsPublicDirective = !!_.find(astNode.directives, (directive) => directive.name.value === 'isPublic')
  if (resolve && !hasIsPublicDirective) {
    field.resolve = async (parent, args, context, astNode) => {
      if (!context.req.user) throw new CustomError(401, 'Not Authenticated', context)
      return resolve.apply(resolve, [parent, args, context, astNode])
    }
  }
}

module.exports = {
  expressMiddleware,
  authenticateUser,
  fieldMutator
}
