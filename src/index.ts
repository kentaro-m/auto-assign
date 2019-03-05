import { Application } from 'probot'
import { handlePullRequest } from './handler'

export = (app: Application) => {
  app.on('pull_request.opened', handlePullRequest)
  
}
