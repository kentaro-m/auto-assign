import { Context } from 'probot'
import { chooseUsers, includesSkipKeywords, chooseUsersFromGroups } from './util'

interface AppConfig {
  addReviewers: boolean,
  addAssignees: boolean,
  reviewers: string[],
  assignees?: string[],
  numberOfAssignees?: number,
  numberOfReviewers: number,
  skipKeywords?: string[],
  useReviewGroups?: boolean,
  useAssigneeGroups?: boolean,
  reviewGroups?: { [key: string]: string[] } | undefined,
  assigneeGroups?: { [key: string]: string[] } | undefined
}

export async function handlePullRequest (context: Context): Promise<void> {
  let config: AppConfig | null = await context.config<AppConfig | null>('auto_assign.yml')
  if (!config) {
    throw new Error('the configuration file failed to load')
  }

  const payload = context.payload

  const prCreator = payload.pull_request.user.login
  const title = payload.pull_request.title

  if (config.skipKeywords && includesSkipKeywords(title, config.skipKeywords)) {
    context.log('skips adding reviewers')
    return
  }

  if(config.useReviewGroups && !config.reviewGroups){
    throw new Error('Error in configuration file to do with using review groups. Expected \'reviewGroups\' variable to be set because the variable \'useReviewGroups\' = true.')
  }

  if(config.useAssigneeGroups && !config.assigneeGroups){
    throw new Error('Error in configuration file to do with using review groups. Expected \'assigneeGroups\' variable to be set because the variable \'useAssigneeGroups\' = true.')
  }

  const reviewers: string[] = await chooseReviewers(context, config, [], prCreator)
  await chooseAssignees(context, config, reviewers, prCreator)
}

export async function chooseReviewers(context: Context, config: AppConfig, reviewers: string[], prCreator: string) {
  if(!config.reviewers && !config.reviewGroups) return []

  // @ts-ignore
  let useGroups: boolean = config.useReviewGroups && Object.keys(config.reviewGroups).length > 0

  if(useGroups) {   
    reviewers = chooseUsersFromGroups(config.reviewGroups, config.numberOfReviewers, prCreator)
  } else { 
    reviewers = chooseUsers(config.reviewers, config.numberOfReviewers, prCreator)
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

export async function chooseAssignees(context: Context, config:AppConfig, reviewers: string[], prCreator: string) {
  if(!config.addAssignees) return

  let assignees: string[] = []
  // @ts-ignore
  let useGroups: boolean = config.useAssigneeGroups && Object.keys(config.assigneeGroups).length > 0
  
  if(useGroups) {
    assignees = chooseUsersFromGroups(config.assigneeGroups, config.numberOfAssignees || config.numberOfReviewers)
  } else if(reviewers.length > 0) {
    assignees = config.assignees ?
      chooseUsers(config.assignees, config.numberOfAssignees || config.numberOfReviewers)
      : reviewers
  }

  if (assignees.length > 0) {
    try {
      const params = context.issue({assignees})
      let result: any = await context.github.issues.addAssignees(params)
      context.log(result)
    } catch (error) {
      context.log(error)
    }
  }
}
