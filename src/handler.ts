import { Context } from 'probot'
import { chooseUsers, includesSkipKeywords, selectUsersFromGroups } from './util'

interface AppConfig {
  addReviewers: boolean,
  addAssignees: boolean,
  useReviewGroups: boolean,
  useAssigneeGroups: boolean,
  reviewers: string[],
  assignees?: string[],
  reviewGroups: string[][],
  assigneeGroups: string[][],
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

  if (config.skipKeywords && includesSkipKeywords(title, config.skipKeywords)) {
    context.log('skips adding reviewers')
    return
  }

  if(config.useReviewGroups && !config.reviewGroups){
    throw new Error('no review group variable defined in the configuration file');
    return;
  }

  if(config.useAssigneeGroups && !config.assigneeGroups){
    throw new Error('no assignee group variable defined in the configuration file')
    return;
  }

  let reviewers = (config.useReviewGroups && config.reviewGroups.length > 0) ?
    selectUsersFromGroups(owner, config.reviewGroups, config.numberOfReviewers)
    : chooseUsers(owner, config.reviewers, config.numberOfReviewers)
  
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
      //Define Assignees
      let assignees: string[] = []
        if(config.useAssigneeGroups && config.assigneeGroups.length > 0) {
            assignees = selectUsersFromGroups(owner, config.assigneeGroups, config.numberOfAssignees || config.numberOfReviewers)

        } else {
          assignees = config.assignees ?
            chooseUsers(owner, config.assignees, config.numberOfAssignees || config.numberOfReviewers)
            : reviewers;
        }

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
