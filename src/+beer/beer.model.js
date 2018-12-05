const { PostgresqlModel } = require('../shared/models/postgresql.model')

class BeerModel extends PostgresqlModel {
  constructor () {
    super('beer', 'postgresql')
  }

  async drink (id, context) {
    return `Gulp Gulp ${this.get(id, context)}`
  }
}

module.exports = {
  BeerModel
}
