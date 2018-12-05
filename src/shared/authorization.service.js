const _ = require('lodash')

function hasRoles (userRoles = new Set(), role) {
  if (!role) return false

  if (userRoles.has('admin')) return true

  if (_.isString(role)) return userRoles.has(role)

  let isAndValid = true
  let isOrValid = true
  if (_.isArray(role.and) || _.isArray(role.or)) {
    if (role.and) isAndValid = _.every(role.and, (role) => hasRoles(userRoles, role))
    if (role.or) isOrValid = _.some(role.or, (role) => hasRoles(userRoles, role))
  }

  return isAndValid && isOrValid
}

module.exports = {
  hasRoles
}
