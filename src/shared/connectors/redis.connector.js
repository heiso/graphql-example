const RedisClient = require('ioredis')
const EventEmitter = require('events')

class RedisConnector extends EventEmitter {
  constructor (config) {
    super()
    this.config = config
    this.attempts = 1
    this.client = null
    this.isConnected = false
    this.connect()
  }

  async connect () {
    try {
      await new Promise((resolve, reject) => {
        this.client = new RedisClient({
          port: this.config.port,
          host: this.config.host
        })
          .on('connect', resolve)
          .on('end', reject)
          .on('error', reject)
      })
      this.isConnected = true
      this.attempts = 1
      this.client.once('close', () => {
        this.emit('disconnected')
        this.connect()
      })
      this.emit('connected')
    } catch (err) {
      this.emit('error', { ...err, attempts: this.attempts })
      this.isConnected = false
      this.attempts++
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return this.connect()
    }
  }
}

module.exports = {
  RedisConnector
}
