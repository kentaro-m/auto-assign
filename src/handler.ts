import { Context } from 'probot'
import AutoAssign from './auto_assign'
import { includesSkipKeywords } from './util'

interface AppConfig {
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
  const config: AppConfig | null = await context.config<AppConfig | null>(
    'auto_assign.yml'
  )
  if (!config) {
    throw new Error('the configuration file failed to load')
  }

  const title = context.payload.pull_request.title
  if (config.skipKeywords && includesSkipKeywords(title, config.skipKeywords)) {
    context.log('skips adding reviewers')
    return
  }

  if (config.useReviewGroups && !config.reviewGroups) {
    throw new Error(
      "Error in configuration file to do with using review groups. Expected 'reviewGroups' variable to be set because the variable 'useReviewGroups' = true."
    )
  }

  if (config.useAssigneeGroups && !config.assigneeGroups) {
    throw new Error(
      "Error in configuration file to do with using review groups. Expected 'assigneeGroups' variable to be set because the variable 'useAssigneeGroups' = true."
    )
  }

  const autoAssign = new AutoAssign(context, config)

  if (config.addReviewers) {
    await autoAssign.addReviewers()
  }

  if (config.addAssignees) {
    await autoAssign.addAssignees()
  }
}
