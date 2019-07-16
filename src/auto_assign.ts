import { Context } from 'probot'
import { chooseUsers, chooseUsersFromGroups } from './util'

interface AppConfig {
  addReviewers: boolean
  addAssignees: boolean | string
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

export default class AutoAssign {
  private config: AppConfig
  private context: Context
  private reviewers: string[]

  public constructor(context: Context, config: AppConfig) {
    this.config = config
    this.context = context
    this.reviewers = []
  }

  public async addReviewers(): Promise<void> {
    const owner = this.context.payload.pull_request.user.login
    const useGroups: boolean =
      this.config.useReviewGroups &&
      Object.keys(this.config.reviewGroups).length > 0

    if (useGroups) {
      this.reviewers = chooseUsersFromGroups(
        owner,
        this.config.reviewGroups,
        this.config.numberOfReviewers
      )
    } else {
      this.reviewers = chooseUsers(
        this.config.reviewers,
        this.config.numberOfReviewers,
        owner
      )
    }

    if (this.config.addReviewers && this.reviewers.length > 0) {
      try {
        const params = this.context.issue({ reviewers: this.reviewers })
        const result = await this.context.github.pullRequests.createReviewRequest(
          params
        )
        this.context.log(result)
      } catch (error) {
        this.context.log(error)
      }
    }
  }

  public async addAssignees(): Promise<void> {
    let assignees: string[] = []
    const owner = this.context.payload.pull_request.user.login
    const useGroups: boolean =
      this.config.useAssigneeGroups &&
      Object.keys(this.config.assigneeGroups).length > 0

    if (typeof this.config.addAssignees === 'string') {
      if (this.config.addAssignees !== 'author') {
        throw new Error(
          "Error in configuration file to do with using addAssignees. Expected 'addAssignees' variable to be either boolean or 'author'"
        )
      }
      assignees = [owner]
    } else if (useGroups) {
      assignees = chooseUsersFromGroups(
        owner,
        this.config.assigneeGroups,
        this.config.numberOfAssignees || this.config.numberOfReviewers
      )
    } else {
      const candidates = this.config.assignees
        ? this.config.assignees
        : this.config.reviewers
      assignees = chooseUsers(
        candidates,
        this.config.numberOfAssignees || this.config.numberOfReviewers,
        owner
      )
    }

    if (assignees.length > 0) {
      try {
        const params = this.context.issue({ assignees })
        const result = await this.context.github.issues.addAssignees(params)
        this.context.log(result)
      } catch (error) {
        this.context.log(error)
      }
    }
  }
}
