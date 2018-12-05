const _ = require('lodash')
const uuid = require('uuid/v4')
const config = require('config')
const redisConnector = require('../shared/connectors/redis.connector')

const CONFIG = config.get('session')
const COOKIE_CONFIG = {
  maxAge: CONFIG.expirationTime,
  httpOnly: CONFIG.httpOnly,
  secure: CONFIG.cookieHttpsOnly,
  sameSite: CONFIG.sameSite
}

async function getSession (token, context) {
  const [key] = await redisConnector.client.keys(_getRedisKey('*', token))
  if (!key) {
    context.res.clearCookie(CONFIG.cookieName)
    throw new Error(`Session not found for token ${token}`)
  }
  return redisConnector.client.get(key).then(_parseSession)
}

async function createSession (user, context) {
  const token = uuid()
  const session = {
    userId: user.id,
    userAgent: context.req.header('user-agent'),
    loggedAt: Date.now()
  }
  const value = _serializeSession(session)
  await redisConnector.client.set(_getRedisKey(user.id, token), value, 'PX', CONFIG.expirationTime, 'NX')
  context.res.cookie(CONFIG.cookieName, token, COOKIE_CONFIG)
  return session
}

async function keepAliveSession (context) {
  const { id, token } = context.req.user
  await redisConnector.client.expire(_getRedisKey(id, token), CONFIG.expirationTime)
  context.res.cookie(CONFIG.cookieName, token, COOKIE_CONFIG)
}

async function destroySession (context) {
  const { id, token } = context.req.user
  await redisConnector.client.del(_getRedisKey(id, token))
  context.res.clearCookie(CONFIG.cookieName, COOKIE_CONFIG)
}

async function getUserSessions (userId) {
  const keys = await _getUserSessionsKeys(userId)
  if (_.isEmpty(keys)) return []
  const values = await redisConnector.client.mget(...keys)
  return _.map(values, _parseSession)
}

async function destroyUserSessions (userId, context) {
  const keys = await _getUserSessionsKeys(userId)
  if (!_.isEmpty(keys)) {
    await redisConnector.client.del(...keys)
    if (context.req.user.id === userId) {
      context.res.clearCookie(CONFIG.cookieName, COOKIE_CONFIG)
    }
  }
}

// use SCAN instead of KEYS for optimisation purpose, perform multiple light operation is better than a big single operation
async function _getUserSessionsKeys (userId, oldKeys = [], cursor = '0') {
  const [newCursor, keys] = await redisConnector.client.scan(cursor, 'MATCH', _getRedisKey(userId))
  const newKeys = [...oldKeys, ...keys]
  if (newCursor !== '0') return _getUserSessionsKeys(userId, newKeys, newCursor)
  return newKeys
}

function _getRedisKey (userId = '*', token = '*') {
  return `${CONFIG.whitelistPrefix}/${userId}/${token}`
}

function _serializeSession (session) {
  return JSON.stringify(session)
}

function _parseSession (value) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch (err) {
    return null
  }
}

module.exports = {
  getSession,
  getUserSessions,
  createSession,
  keepAliveSession,
  destroySession,
  destroyUserSessions
}
