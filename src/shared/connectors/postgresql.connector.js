const { Pool } = require('pg')
const EventEmitter = require('events')

class PostgresqlConnector extends EventEmitter {
  constructor (config) {
    super()
    this.config = config
    this.pool = null
    this.connect()
  }

  async isConnected () {
    try {
      await this.pool.query('SELECT 1')
      return true
    } catch (err) {
      return false
    }
  }

  async connect () {
    try {
      this.pool = await new Pool(this.config)
      this.pool.once('error', async (err) => {
        this.emit('disconnected')
        this.error(`${err.message}`, err)
        await this.pool.end()
        this.connect()
      })
      this.emit('connected')
    } catch (err) {
      this.emit('error', err)
    }
  }
}

module.exports = {
  PostgresqlConnector
}
