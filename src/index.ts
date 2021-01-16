import { handlePullRequest } from './handler'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export = (app: any): void => {
  app.on('pull_request.opened', handlePullRequest)
  app.on('pull_request.ready_for_review', handlePullRequest)
}
