// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createNodeMiddleware, createProbot } = require('probot')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../../../lib/index.js')

module.exports = createNodeMiddleware(app, {
  probot: createProbot(),
  webhooksPath: '/api/github/webhooks',
})
