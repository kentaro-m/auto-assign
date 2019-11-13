import { Context } from 'probot'
import { includesSkipKeywords, chooseAssignees, chooseReviewers } from './util'

export interface Config {
  addReviewers: boolean
  addAssignees: boolean
  reviewers: string[]
  assignees: string[]
  numberOfAssignees: number
  numberOfReviewers: number
  skipKeywords: string[]
  useReviewGroups: boolean
  useAssigneeGroups: boolean
  reviewGroups: { [key: string]: string[] }
  assigneeGroups: { [key: string]: string[] }
}

export async function handlePullRequest(context: Context): Promise<void> {
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
    addAssignees
  } = config

  if (config.skipKeywords && includesSkipKeywords(title, skipKeywords)) {
    context.log('skips adding reviewers')
    return
  }
  if (context.payload.pull_request.draft) {
    context.log('ignore draft PR')
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

  if (addReviewers) {
    try {
      const reviewers = chooseReviewers(owner, config)

      if (reviewers.length > 0) {
        const params = context.issue({ reviewers })
        const result = await context.github.pulls.createReviewRequest(params)
        context.log(result)
      }
    } catch (error) {
      context.log(error)
    }
  }

  if (addAssignees) {
    try {
      const assignees = chooseAssignees(owner, config)

      if (assignees.length > 0) {
        const params = context.issue({ assignees })
        const result = await context.github.issues.addAssignees(params)
        context.log(result)
      }
    } catch (error) {
      context.log(error)
    }
  }
}
