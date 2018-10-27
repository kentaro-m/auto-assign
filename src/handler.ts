import { Context } from 'probot'
import { PullRequest } from './pull_request'
import { chooseUsers, includesSkipKeywords } from './util'

interface AppConfig {
  addReviewers: boolean,
  addAssignees: boolean,
  reviewers: string[],
  assignees?: string[],
  numberOfAssignees?: number,
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

  const reviewers = chooseUsers(owner, config.reviewers, config.numberOfReviewers)

  const pullRequest = new PullRequest(context)

  let result: Promise<any>

  if (config.addReviewers) {
    try {
      result = await pullRequest.addReviewers(owner, repo, prNumber, reviewers)
      context.log(result)
    } catch (error) {
      context.log(error)
    }
  }

  if (config.addAssignees) {
    try {
      const assignees: string[] = config.assignees ?
        chooseUsers(owner, config.assignees, config.numberOfAssignees || config.numberOfReviewers)
        :
        reviewers

      result = await pullRequest.addAssignees(owner, repo, prNumber, assignees)
      context.log(result)
    } catch (error) {
      context.log(error)
    }
  }
}
