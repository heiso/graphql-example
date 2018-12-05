const _ = require('lodash')
const config = require('config')
const squel = require('squel').useFlavour('postgres')
const { pbkdf2Sync } = require('crypto')
const { PostgresqlModel } = require('../shared/models/postgresql.model')
const { getUserSessions, createSession, destroyUserSessions } = require('../shared/session.service')
const { CustomError } = require('../shared/error.service')

const CONFIG = config.get('session')

class UserModel extends PostgresqlModel {
  constructor () {
    super('users', 'postgresql')
  }

  async getMe () {
    return this.context.req.user
  }

  async login (email, password) {
    try {
      const query = squel
        .select()
        .from(this.table)
        .where('deleted = false')
        .where('email = ?', email)
        .where('password = ?', this._getHashedPassword(email, password))
        .toParam()
      const { rows } = await this.pool.query(query)
      const user = this._parseRow(_.first(rows))

      if (!user) throw Error('User not found')

      await createSession(user, this.context)

      return user
    } catch (err) {
      throw new CustomError(100, 'Failed to Authenticate', this.context)
    }
  }

  async logout () {
    await destroyUserSessions(this.context.req.user.id, this.context)
    return this.context.req.user
  }

  async get (id) {
    // Todo: instead of using context, must use a cache system
    if (this.context.req.user && this.context.req.user.id === id) return this.context.req.user
    return PostgresqlModel.prototype.get.apply(this, [id])
  }

  async getRoles (userId) {
    // Todo: instead of using context, must use a cache system
    if (this.context.req.user && this.context.req.user.id === userId && this.context.req.user.roles) return this.context.req.user.roles
    const query = squel
      .select('name')
      .from('roles')
      .join('users_roles', 'ur', 'roles.id = ur.id_role')
      .join('users', null, 'ur.id_user = users.id')
      .where('users.id = ?', userId)
      .where('roles.deleted = false')
      .toParam()
    const { rows } = await this.pool.query(query)
    return new Set(rows.map((row) => row.name))
  }

  getSessions () {
    return getUserSessions(this.context.req.user.id)
  }

  async updateMe (input) {
    return this.update(this.context.req.user.id, input)
  }

  async delete (id) {
    await destroyUserSessions(id, this.context)
    return PostgresqlModel.prototype.delete.apply(this, [id])
  }

  _getHashedPassword (email, password) {
    const { passwordSalt, passwordIterations, passwordByteLength, passwordAlg } = CONFIG
    const salt = `${email}_${passwordSalt}`
    return pbkdf2Sync(password, salt, passwordIterations, passwordByteLength, passwordAlg).toString('hex')
  }
}

module.exports = {
  UserModel
}
