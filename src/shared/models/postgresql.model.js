const _ = require('lodash')
const squel = require('squel').useFlavour('postgres')
const uuidv4 = require('uuid/v4')

const DEFAULT_WHERE = `deleted = false`
const DEFAULT_LIMIT = 100

class PostgresqlModel {
  constructor (table, connector) {
    this.table = table
    this.connector = connector
  }

  initialize (config) {
    this.context = config.context
    this.pool = config.context.connectors[this.connector].pool
  }

  async get (id) {
    const query = squel
      .select()
      .from(this.table)
      .where(DEFAULT_WHERE)
      .where('id = ?', id)
      .toParam()
    const { rows } = await this.pool.query(query)
    return this._parseRow(_.first(rows))
  }

  async list ({ limit = DEFAULT_LIMIT, isDesc = true }, wheres) {
    const query = squel
      .select()
      .from(this.table)
      .where(DEFAULT_WHERE)
      .limit(limit)
      .order('created_at', !isDesc)

    if (_.isArray(wheres) && wheres.length > 0) {
      wheres.forEach((where) => {
        query.where(where.field, where.value)
      })
    }

    const { rows } = await this.pool.query(query.toParam())
    return _.map(rows, this._parseRow)
  }

  async listConnection ({ first, last, after, before }, wheres) {
    const limit = first || last
    const cursor = after || before
    const isDesc = !!last

    const cursoredWhere = this._getCursoredWhere({ after, before })

    if (cursoredWhere) wheres = [...wheres, cursoredWhere]

    const nodes = await this.list({ limit, isDesc }, wheres)

    return this._parseNodes({ cursor, isDesc }, nodes)
  }

  async belongsTo (foreignKey, belongsToId, { limit = DEFAULT_LIMIT, isDesc = true }, wheres) {
    const query = squel
      .select()
      .from(this.table)
      .where(DEFAULT_WHERE)
      .where(`${foreignKey} = ?`, belongsToId)
      .limit(limit)
      .order('created_at', !isDesc)

    if (_.isArray(wheres) && wheres.length > 0) {
      wheres.forEach((where) => {
        query.where(where.field, where.value)
      })
    }

    const { rows } = await this.pool.query(query.toParam())
    return _.map(rows, this._parseRow)
  }

  async belongsToConnection (foreignKey, belongsToId, { first, last, after, before }, wheres) {
    const limit = first || last
    const cursor = after || before
    const isDesc = !!last

    const cursoredWhere = this._getCursoredWhere({ after, before })

    if (cursoredWhere) wheres = [...wheres, cursoredWhere]

    const nodes = await this.belongsTo(foreignKey, belongsToId, { limit, isDesc }, wheres)

    return this._parseNodes({ cursor, isDesc }, nodes)
  }

  async create (input) {
    const fields = {
      ...input,
      id: uuidv4()
    }
    const query = squel
      .insert()
      .into(this.table)
      .setFields(fields)
      .returning('*')
      .toParam()
    const { rows } = await this.pool.query(query)
    return this._parseRow(_.first(rows))
  }

  async update (id, input) {
    const query = squel
      .update()
      .table(this.table)
      .setFields(input)
      .where('id = ?', id)
      .returning('*')
      .toParam()
    const { rows } = await this.pool.query(query)
    return this._parseRow(_.first(rows))
  }

  async delete (id) {
    const query = squel
      .update()
      .table(this.table)
      .set('deleted', true)
      .where('id = ?', id)
      .returning('*')
      .toParam()
    const { rows } = await this.pool.query(query)
    return this._parseRow(_.first(rows))
  }

  _getCursoredWhere ({ after, before }) {
    let where = false
    if (after) {
      where = {
        field: 'created_at > ?',
        value: squel.select().field('created_at').from(this.table).where('id = ?', after)
      }
    } else if (before) {
      where = {
        field: 'created_at < ?',
        value: squel.select().field('created_at').from(this.table).where('id = ?', before)
      }
    }
    return where
  }

  _parseRow (row = {}) {
    if (!_.size(row)) return null
    return {
      ..._.omit(row, ['created_at', 'updated_at']),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  async _parseNodes ({ cursor, isDesc }, nodes = []) {
    let startCursor = cursor
    let endCursor = cursor

    if (nodes.length > 0) {
      startCursor = (isDesc) ? _.last(nodes).id : _.first(nodes).id
      endCursor = (isDesc) ? _.first(nodes).id : _.last(nodes).id
    }

    const hasPreviousPageQuery = squel
      .select()
      .field('COUNT(id) as count')
      .from(this.table)
      .where('created_at < ?', squel.select().field('created_at').from(this.table).where('id = ?', startCursor))
      .toParam()
    const hasNextPageQuery = squel
      .select()
      .field('COUNT(id) as count')
      .from(this.table)
      .where('created_at > ?', squel.select().field('created_at').from(this.table).where('id = ?', endCursor))
      .toParam()

    const [{ rows: hasPreviousRows }, { rows: hasNextRows }] = await Promise.all([
      this.pool.query(hasPreviousPageQuery),
      this.pool.query(hasNextPageQuery)
    ])
    const hasPreviousPage = _.first(hasPreviousRows).count > 0
    const hasNextPage = _.first(hasNextRows).count > 0

    return {
      pageInfo: {
        hasPreviousPage,
        hasNextPage
      },
      edges: nodes.map((node) => {
        return {
          cursor: node.id,
          node: this._parseRow(node)
        }
      })
    }
  }
}

module.exports = {
  PostgresqlModel
}
