import { Context } from 'probot'

export class PullRequest {
  public context: Context

  constructor (context: Context) {
    this.context = context
  }

  public async addAssignees (owner: string, repo: string, prNumber: number, assignees: string[]): Promise<any> {
    const result = await this.context.github.issues.addAssigneesToIssue({
      assignees,
      number: prNumber,
      owner,
      repo
    })

    return result
  }

  public async addReviewers (owner: string, repo: string, prNumber: number, reviewers: string[]): Promise<any> {
    const result = await this.context.github.pullRequests.createReviewRequest({
      number: prNumber,
      owner,
      repo,
      reviewers
    })

    return result
  }
}
