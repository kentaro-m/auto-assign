import { Context } from 'probot'
import { PullRequest } from './pull_request'
import { createReviewerList, includesSkipKeywords } from './util'

interface AppConfig {
  addReviewers: boolean,
  addAssignees: boolean,
  reviewers: string[],
  numberOfReviewers: number,
  skipKeywords?: string[]
}

export async function handlePullRequest (context: Context): Promise<void> {
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
    context.log('skips adding reviewers')
    return
  }

  const reviewers = createReviewerList(owner, config.reviewers, config.numberOfReviewers)

  const pullRequest = new PullRequest(context)

  let result: Promise<any>

  if (config.addReviewers) {
    result = await pullRequest.addReviewers(owner, repo, prNumber, reviewers)
    context.log(result)
  }

  if (config.addAssignees) {
    result = await pullRequest.addAssignees(owner, repo, prNumber, reviewers)
    context.log(result)
  }
}
