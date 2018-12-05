const { PostgresqlModel } = require('../shared/models/postgresql.model')

class BreweryModel extends PostgresqlModel {
  constructor () {
    super('brewery', 'postgresql')
  }
}

module.exports = {
  BreweryModel
}
