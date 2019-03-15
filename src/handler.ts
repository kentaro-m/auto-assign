import { Context } from 'probot'
import { chooseUsers, includesSkipKeywords, chooseUsersFromGroups } from './util'

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
  let config: AppConfig | null = await context.config<AppConfig | null>('auto_assign.yml')
  if (!config) {
    throw new Error('the configuration file failed to load')
  }

  const title = context.payload.pull_request.title
  if (config.skipKeywords && includesSkipKeywords(title, config.skipKeywords)) {
    context.log('skips adding reviewers')
    return
  }

  if(config.useReviewGroups && !config.reviewGroups){
    throw new Error('no review group variable defined in the configuration file')
    return
  }

  if(config.useAssigneeGroups && !config.assigneeGroups){
    throw new Error('no assignee group variable defined in the configuration file')
    return
  }

  let reviewers: string[] = []
  reviewers = await chooseReviewers(context, config, reviewers, context.payload.repository.owner.login)
  await chooseAssignees(context, config, reviewers, context.payload.repository.owner.login)
}


export async function chooseReviewers(context: Context, config: AppConfig, reviewers: string[], owner: string) {
  let ableToAddReviewersWithGroups: boolean = config.useReviewGroups && Object.keys(config.reviewGroups).length > 0
  let ableToAddReviewersWithoutGroups: boolean = config.reviewers && (config.addReviewers || config.addAssignees)

  if(ableToAddReviewersWithGroups) {   
    reviewers = chooseUsersFromGroups(owner, config.reviewGroups, config.numberOfReviewers)
  } else if(ableToAddReviewersWithoutGroups) { 
    reviewers = chooseUsers(owner, config.reviewers, config.numberOfReviewers)
  }
  
  if (config.addReviewers && reviewers.length > 0) {
    try {
      const params = context.issue({reviewers})
      let result: any = await context.github.pullRequests.createReviewRequest(params)
      context.log(result)
    } catch (error) {
      context.log(error)
    }
  }
  return reviewers
}

export async function chooseAssignees(context: Context, config:AppConfig, reviewers: string[], owner: string) {
  let ableToAddAssigneesWithoutGroups: boolean = config.addAssignees && (reviewers.length > 0)
  let ableToAddAssigneesWithGroups: boolean = config.addAssignees && config.useAssigneeGroups && Object.keys(config.assigneeGroups).length > 0

  if (ableToAddAssigneesWithoutGroups || ableToAddAssigneesWithGroups) {
    try {
      let assignees: string[] = []
      if(ableToAddAssigneesWithGroups) {
        assignees = chooseUsersFromGroups(owner, config.assigneeGroups, config.numberOfAssignees || config.numberOfReviewers)
      } else {
        assignees = config.assignees ?
          chooseUsers(owner, config.assignees, config.numberOfAssignees || config.numberOfReviewers)
          : reviewers
      }

      const params = context.issue({assignees})
      let result: any = await context.github.issues.addAssignees(params)
      context.log(result)
    } catch (error) {
      context.log(error)
    }
  }
}
