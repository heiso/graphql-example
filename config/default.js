module.exports = {
  express: {
    port: 3000,
    cors: '*',
    engine: false,
    tracing: true
  },
  authentication: {
    passwordSalt: 'DFgusdFGhgj248Rdhqodfgp',
    passwordIterations: 100000,
    passwordByteLength: 128,
    passwordAlg: 'SHA256'
  },
  session: {
    whitelistPrefix: 'session',
    cookieName: 'session',
    expirationTime: 1000 * 60 * 60 * 24 * 31,
    httpOnly: true,
    cookieHttpsOnly: false,
    sameSite: true
  },
  connectors: {
    postgresql: {
      host: '127.0.0.1',
      port: 5432,
      database: 'graphql_example',
      user: 'graphql_example',
      password: 'password'
    },
    redis: {
      host: '127.0.0.1',
      port: 6379
    }
  }
}
