import { Context } from 'probot'
import { includesSkipKeywords, chooseAssignees, chooseReviewers } from './util'

type PullRequestContext = Context<
  'pull_request.opened' | 'pull_request.ready_for_review'
>

export interface Config {
  addReviewers: boolean
  addAssignees: boolean | 'author'
  reviewers: string[]
  assignees: string[]
  numberOfAssignees: number
  numberOfReviewers: number
  skipKeywords: string[]
  useReviewGroups: boolean
  useAssigneeGroups: boolean
  reviewGroups: { [key: string]: string[] }
  assigneeGroups: { [key: string]: string[] }
  skipUsers: string[]
}

export async function handlePullRequest(
  context: PullRequestContext
): Promise<void> {
  const config = (await context.config('auto_assign.yml')) as Config

  if (!config) {
    throw new Error('the configuration file failed to load')
  }

  const title = context.payload.pull_request.title
  const {
    skipKeywords,
    useReviewGroups,
    reviewGroups,
    useAssigneeGroups,
    assigneeGroups,
    addReviewers,
    addAssignees,
    skipUsers,
  } = config

  if (skipKeywords && includesSkipKeywords(title, skipKeywords)) {
    context.log.info('skips adding reviewers')
    return
  }
  if (context.payload.pull_request.draft) {
    context.log.info('ignore draft PR')
    return
  }

  if (useReviewGroups && !reviewGroups) {
    throw new Error(
      "Error in configuration file to do with using review groups. Expected 'reviewGroups' variable to be set because the variable 'useReviewGroups' = true."
    )
  }

  if (useAssigneeGroups && !assigneeGroups) {
    throw new Error(
      "Error in configuration file to do with using review groups. Expected 'assigneeGroups' variable to be set because the variable 'useAssigneeGroups' = true."
    )
  }

  const owner = context.payload.pull_request.user.login

  if (skipUsers && skipUsers.includes(owner)) {
    context.log.info(`ignore for user ${owner}`)
    return
  }

  if (addReviewers) {
    try {
      const { reviewers, team_reviewers } = chooseReviewers(owner, config)

      if (reviewers.length > 0 || team_reviewers.length > 0) {
        const params = context.pullRequest({ reviewers, team_reviewers })
        const result = await context.octokit.pulls.requestReviewers(params)
        context.log.info(result)
      }
    } catch (error) {
      if (error instanceof Error) {
        context.log.error(error)
      }
    }
  }

  if (addAssignees) {
    try {
      const assignees = chooseAssignees(owner, config)

      if (assignees.length > 0) {
        const params = context.issue({ assignees })
        const result = await context.octokit.issues.addAssignees(params)
        context.log.info(result)
      }
    } catch (error) {
      if (error instanceof Error) {
        context.log.error(error)
      }
    }
  }
}
