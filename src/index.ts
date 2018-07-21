import { Application, Context } from 'probot'
import { PullRequest } from './pull_request'
import { createReviewerList, includesSkipKeywords } from './util'

interface AppConfig {
  addReviewers: boolean,
  addAssignees: boolean,
  reviewers: string[],
  numberOfReviewers: number,
  skipKeywords?: string[]
}

export = (app: Application) => {
  app.on('pull_request.opened', handlePullRequest)

  async function handlePullRequest (context: Context): Promise<void> {
    let config: AppConfig | null

    config = await context.config<AppConfig | null>('auto_assign.yml')

    if (!config) {
      throw new Error('the configuration file failed to load')
    }

    const payload = context.payload

    const prNumber = payload.number
    const repo = payload.repository.name
    const owner = payload.repository.owner.login
    const title = payload.pull_request.title

    if (config.skipKeywords && includesSkipKeywords(title, config.skipKeywords)) {
      app.log('the process that add reviewers is skipped')
      return
    }

    const reviewers = createReviewerList(owner, config.reviewers, config.numberOfReviewers)

    const pullRequest = new PullRequest(context)

    let result: Promise<any>

    if (config.addReviewers) {
      result = await pullRequest.addReviewers(owner, repo, prNumber, reviewers)
      app.log(result)
    }

    if (config.addAssignees) {
      result = await pullRequest.addAssignees(owner, repo, prNumber, reviewers)
      app.log(result)
    }
  }
}
