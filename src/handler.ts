import { Context } from 'probot'
import { chooseUsers, includesSkipKeywords } from './util'

interface AppConfig {
  addReviewers: boolean,
  addAssignees: boolean,
  reviewers: string[],
  assignees?: string[],
  reviewGroups: string[][],
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

  const owner = payload.repository.owner.login
  const title = payload.pull_request.title

  context.log(config.reviewGroups)

  if (config.skipKeywords && includesSkipKeywords(title, config.skipKeywords)) {
    context.log('skips adding reviewers')
    return
  }

  const reviewers = chooseUsers(owner, config.reviewers, config.numberOfReviewers)

  let result: any

  if (config.addReviewers && reviewers.length > 0) {
    try {
      const params = context.issue({
        reviewers
      })
      result = await context.github.pullRequests.createReviewRequest(params)
      context.log(result)
    } catch (error) {
      context.log(error)
    }
  }

  if (config.addAssignees && reviewers.length > 0) {
    try {
      const assignees: string[] = config.assignees ?
        chooseUsers(owner, config.assignees, config.numberOfAssignees || config.numberOfReviewers)
        :
        reviewers

      const params = context.issue({
        assignees
      })
      result = await context.github.issues.addAssignees(params)
      context.log(result)
    } catch (error) {
      context.log(error)
    }
  }
}
