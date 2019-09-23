import { Application } from 'probot'
import { handlePullRequest } from './handler'

export = (app: Application): void => {
  app.on('pull_request.opened', handlePullRequest)
  app.on('pull_request.ready_for_review', handlePullRequest)
}
