import { Context } from 'probot'
import { chooseUsers, chooseUsersFromGroups } from './util'

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

export default class AutoAssign {
  private config: AppConfig
  private context: Context
  private reviewers: string[]

  constructor (context: Context, config: AppConfig) {
    this.config = config
    this.context = context
    this.reviewers = []
  }

  public async addReviewers () {
    const owner = this.context.payload.repository.owner.login
    // @ts-ignore
    const useGroups = this.config.hasOwnProperty('useReviewGroups') && this.config.useReviewGroups && Object.keys(this.config.reviewGroups).length > 0

    if (useGroups) {
      this.reviewers = chooseUsersFromGroups(owner, this.config.reviewGroups, this.config.numberOfReviewers)
    } else {
      this.reviewers = chooseUsers(owner, this.config.reviewers, this.config.numberOfReviewers)
    }

    if (this.config.addReviewers && this.reviewers) {
      try {
        const params = this.context.issue({ reviewers: this.reviewers })
        const result: any = await this.context.github.pullRequests.createReviewRequest(params)
        this.context.log(result)
      } catch (error) {
        this.context.log(error)
      }
    }
  }

  public async addAssignees () {
    const owner = this.context.payload.repository.owner.login
    // @ts-ignore
    const useGroups: boolean = this.config.hasOwnProperty('useAssigneeGroups') && this.config.useAssigneeGroups && Object.keys(this.config.assigneeGroups).length > 0

    let assignees

    if (useGroups) {
      assignees = chooseUsersFromGroups(owner, this.config.assigneeGroups, this.config.numberOfAssignees || this.config.numberOfReviewers)
    } else {
      assignees = this.config.assignees ?
        chooseUsers(owner, this.config.assignees, this.config.numberOfAssignees || this.config.numberOfReviewers)
        : this.config.reviewers
    }

    if (assignees) {
      try {
        const params = this.context.issue({ assignees })
        const result: any = await this.context.github.issues.addAssignees(params)
        this.context.log(result)
      } catch (error) {
        this.context.log(error)
      }
    }
  }
}