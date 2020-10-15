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
  reviewersInTeams: string[]
}

export async function getTeamMembers(
  context: Context,
  { org, teamSlug }: { org: string; teamSlug: string }
): Promise<string[]> {
  let members: { login: string }[] = []

  try {
    members = (
      await context.github.teams.listMembersInOrg({
        org,
        // eslint-disable-next-line @typescript-eslint/camelcase
        team_slug: teamSlug
      })
    ).data
  } catch (error) {
    context.log(error)
  }

  if (members.length === 0) {
    let team

    try {
      team = (
        await context.github.teams.getByName({
          org,
          // eslint-disable-next-line @typescript-eslint/camelcase
          team_slug: teamSlug
        })
      ).data
    } catch (error) {
      context.log(error)
      throw new Error(
        `Cannot fetch team id for team ${teamSlug} under organisation ${org}.`
      )
    }

    try {
      members = (
        await context.github.teams.listMembersLegacy({
          // eslint-disable-next-line @typescript-eslint/camelcase
          team_id: team.id
        })
      ).data
    } catch (error) {
      context.log(error)
      throw new Error(
        `Cannot fetch list of members in team ${teamSlug} under organisation ${org}.`
      )
    }
  }

  return members.map((member): string => member.login)
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
    addAssignees,
    reviewersInTeams
  } = config

  if (skipKeywords && includesSkipKeywords(title, skipKeywords)) {
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

  if (reviewersInTeams && reviewersInTeams.length > 0) {
    for (const team of reviewersInTeams) {
      const result = /^([\w\-]+)\/([\w\-]+)$/.exec(team)
      if (result === null) {
        throw new Error(
          'Error in configuration file to expand a team reviewersInTeams must be a list of org/team_slug.'
        )
      }
      const reviewers = await getTeamMembers(context, {
        org: result[1],
        teamSlug: result[2]
      })
      config.reviewers = Array.from(
        new Set((config.reviewers || []).concat(reviewers))
      )
    }
  }

  const owner = context.payload.pull_request.user.login

  if (addReviewers) {
    try {
      // eslint-disable-next-line @typescript-eslint/camelcase
      const { reviewers, team_reviewers } = chooseReviewers(owner, config)

      // eslint-disable-next-line @typescript-eslint/camelcase
      if (reviewers.length > 0 || team_reviewers.length > 0) {
        // eslint-disable-next-line @typescript-eslint/camelcase
        const params = context.issue({ reviewers, team_reviewers })
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
