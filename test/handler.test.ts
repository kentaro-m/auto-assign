import { Context } from 'probot'
import { handlePullRequest } from '../src/handler'

describe('handlePullRequest', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  let context: Context

  beforeEach(async () => {
    event = {
      id: '123',
      name: 'pull_request',
      payload: {
        action: 'opened',
        number: '1',
        pull_request: {
          number: '1',
          title: 'test',
          user: {
            login: 'pr-creator',
          },
        },
        repository: {
          name: 'auto-assign',
          owner: {
            login: 'kentaro-m',
          },
        },
      },
      draft: false,
    }

    const mockOctokit = {
      issues: { addAssignees: jest.fn() },
      pulls: { requestReviewers: jest.fn() },
      hook: {
        before: jest.fn(),
        after: jest.fn(),
        wrap: jest.fn(),
        remove: jest.fn(),
      },
      rest: {
        issues: { addAssignees: jest.fn() },
        pulls: { requestReviewers: jest.fn() },
      },
    }
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    }

    context = new Context<
      'pull_request.opened' | 'pull_request.ready_for_review'
    >(
      event, // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockOctokit as any, // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockLogger as any
    )

    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        numberOfReviewers: 0,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3'],
        skipKeywords: ['wip'],
      }
    })
  })

  test('responds with the error if the configuration file failed to load', async () => {
    try {
      context.config = jest.fn().mockImplementation(async () => undefined)
      await handlePullRequest(context)
    } catch (error) {
      expect(error).toEqual(new Error('the configuration file failed to load'))
    }
  })

  test('exits the process if pull requests include skip words in the title', async () => {
    const spy = jest.spyOn(context.log, 'info')

    event.payload.pull_request.title = 'wip test'
    await handlePullRequest(context)

    expect(spy.mock.calls[0][0]).toEqual('skips adding reviewers')
  })

  test('skips drafts', async () => {
    const spy = jest.spyOn(context.log, 'info')

    event.payload.pull_request.draft = true
    await handlePullRequest(context)

    expect(spy.mock.calls[0][0]).toEqual('ignore draft PR')
  })

  test('adds reviewers to pull requests if the configuration is enabled, but no assignees', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: false,
        addReviewers: true,
        numberOfReviewers: 0,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3', 'pr-creator'],
        skipKeywords: ['wip'],
      }
    })

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    await handlePullRequest(context)

    expect(addAssigneesSpy).not.toBeCalled()
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers).toHaveLength(3)
    expect(requestReviewersSpy.mock.calls[0][0]?.team_reviewers).toHaveLength(0)
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[0]).toMatch(
      /reviewer/
    )
  })

  test('adds team_reviewers to pull requests if the configuration is enabled, but no assignees', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: false,
        addReviewers: true,
        numberOfReviewers: 0,
        reviewers: ['/team_reviewer1'],
        skipKeywords: ['wip'],
      }
    })

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    await handlePullRequest(context)

    expect(addAssigneesSpy).not.toBeCalled()
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers).toHaveLength(0)
    expect(requestReviewersSpy.mock.calls[0][0]?.team_reviewers).toHaveLength(1)
    expect(requestReviewersSpy.mock.calls[0][0]?.team_reviewers?.[0]).toMatch(
      /team_reviewer/
    )
  })

  test('adds pr-creator as assignee if addAssignees is set to author', async () => {
    // MOCKS
    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')

    // GIVEN
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: 'author',
      }
    })

    // WHEN
    await handlePullRequest(context)

    // THEN
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toHaveLength(1)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[0]).toMatch(
      'pr-creator'
    )
    expect(requestReviewersSpy).not.toBeCalled()
  })

  test('responds with error if addAssignees is not set to boolean or author', async () => {
    // MOCKS
    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    // GIVEN
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: 'test',
      }
    })

    try {
      await handlePullRequest(context)
    } catch (error) {
      expect(error).toEqual(
        new Error(
          "Error in configuration file to do with using addAssignees. Expected 'addAssignees' variable to be either boolean or 'author'"
        )
      )
    }
  })

  test('adds reviewers to assignees to pull requests if the configuration is enabled ', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: false,
        numberOfReviewers: 0,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3', 'pr-creator'],
        skipKeywords: ['wip'],
      }
    })

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    await handlePullRequest(context)

    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toHaveLength(3)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[0]).toMatch(/reviewer/)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toEqual(
      expect.arrayContaining(['reviewer1', 'reviewer2', 'reviewer3'])
    )
    expect(requestReviewersSpy).not.toBeCalled()
  })

  test('adds assignees to pull requests if the assigness are enabled explicitly', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: false,
        assignees: ['assignee1', 'pr-creator'],
        numberOfAssignees: 2,
        numberOfReviewers: 0,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3'],
        skipKeywords: ['wip'],
      }
    })

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    await handlePullRequest(context)

    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toHaveLength(1)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toEqual(
      expect.arrayContaining(['assignee1'])
    )
    expect(requestReviewersSpy).not.toBeCalled()
  })

  test('adds assignees to pull requests using the numberOfReviewers when numberOfAssignees is unspecified', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        assignees: ['assignee1', 'assignee2', 'assignee3'],
        numberOfReviewers: 2,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3'],
        skipKeywords: ['wip'],
      }
    })

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    await handlePullRequest(context)

    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toHaveLength(2)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[0]).toMatch(/assignee/)
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers).toHaveLength(2)
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[0]).toMatch(
      /reviewer/
    )
  })

  test("doesn't add assignees if the reviewers contain only a pr creator and assignees are not explicit", async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        numberOfReviewers: 0,
        reviewers: ['pr-creator'],
        skipKeywords: ['wip'],
      }
    })

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    await handlePullRequest(context)

    expect(addAssigneesSpy).not.toHaveBeenCalled()
    expect(requestReviewersSpy).not.toHaveBeenCalled()
  })

  test('adds assignees to pull requests if throws error to add reviewers', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        assignees: ['maintainerX', 'maintainerY'],
        numberOfReviewers: 0,
        reviewers: ['reviewerA', 'reviewerB'],
        skipKeywords: ['wip'],
      }
    })

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => {
        throw new Error('Review cannot be requested from pull request author.')
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const spy = jest.spyOn(context.octokit.issues, 'addAssignees')

    await handlePullRequest(context)

    expect(spy.mock.calls[0][0]?.assignees).toHaveLength(2)
    expect(spy.mock.calls[0][0]?.assignees?.[0]).toMatch(/maintainer/)
  })

  test('adds reviewers to pull requests if throws error to add assignees', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        assignees: ['maintainerX', 'maintainerY'],
        numberOfReviewers: 0,
        reviewers: ['reviewerA', 'reviewerB'],
        skipKeywords: ['wip'],
      }
    })

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => {
        throw new Error('failed to add assignees.')
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const spy = jest.spyOn(context.octokit.pulls, 'requestReviewers')

    await handlePullRequest(context)

    expect(spy.mock.calls[0][0]?.reviewers).toHaveLength(2)
    expect(spy.mock.calls[0][0]?.reviewers?.[0]).toMatch(/reviewer/)
  })

  test('adds all assingnees to pull requests when 0 is set to numberOfAssignees', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        numberOfAssignees: 0,
        assignees: ['assigneeA', 'assigneeB'],
        numberOfReviewers: 1,
        reviewers: ['reviewerA', 'reviewerB', 'reviewerC'],
      }
    })

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    await handlePullRequest(context)

    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toHaveLength(2)
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers).toHaveLength(1)
  })

  /*
   * If 'useReviewGroups' == true, then use the 'groups' object to select reviewers and assignees.
   * The new functionality will still decide to add reviewers and assignees based on the 'addReviewers'
   * and 'addAssignees' flags.
   *
   * Use Cases for group reviews:
   * - if the groups are not present or an empty list, then use normal reviewer functionality
   * - if 'addReviewers' == true
   *   - if #reviewers is 0, follow default behavior (add all users to review)
   *   - if #reviewers is > 0, select #reviewers randomly (exclude self) from each group
   *     + if #peopleInGroup is < #reviewers, select all people in that group to review
   *
   * - if 'addAssignees' == true
   *   - var assignees = #reviewers || #assignees
   *   - if assignees is 0, follow default behavior (add all users to review)
   *   - if assignees is > 0, select assignees randomly (exclude self) from each group
   *     - if #peopleInGroup is < assignees, select all people in that group to be assignees
   */
  test('responds with the error if review groups are enabled, but no reviewGroups variable is defined in configuration', async () => {
    try {
      // GIVEN
      context.config = jest.fn().mockImplementation(async () => {
        return {
          useReviewGroups: true,
        }
      })

      // WHEN
      await handlePullRequest(context)
    } catch (error) {
      // THEN
      expect(error).toEqual(
        new Error(
          "Error in configuration file to do with using review groups. Expected 'reviewGroups' variable to be set because the variable 'useReviewGroups' = true."
        )
      )
    }
  })

  test('responds with the error if assignee groups are enabled, but no assigneeGroups variable is defined in configuration', async () => {
    try {
      // GIVEN
      context.config = jest.fn().mockImplementation(async () => {
        return {
          useAssigneeGroups: true,
        }
      })

      // WHEN
      await handlePullRequest(context)
    } catch (error) {
      // THEN
      expect(error).toEqual(
        new Error(
          "Error in configuration file to do with using review groups. Expected 'assigneeGroups' variable to be set because the variable 'useAssigneeGroups' = true."
        )
      )
    }
  })

  test('adds reviewers to pull request from reviewers if groups are enabled and empty', async () => {
    // MOCKS
    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')

    // GIVEN
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: false,
        addReviewers: true,
        useReviewGroups: true,
        numberOfReviewers: 1,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3'],
        reviewGroups: [],
      }
    })

    // WHEN
    await handlePullRequest(context)

    // THEN
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers).toHaveLength(1)
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[0]).toMatch(
      /reviewer/
    )
    expect(addAssigneesSpy).not.toBeCalled()
  })

  test('adds reviewers to pull request from two different groups if review groups are enabled', async () => {
    // MOCKS
    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')

    // GIVEN
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: false,
        addReviewers: true,
        useReviewGroups: true,
        numberOfReviewers: 1,
        reviewGroups: {
          groupA: ['group1-user1', 'group1-user2', 'group1-user3'],
          groupB: ['group2-user1', 'group2-user2', 'group2-user3'],
        },
      }
    })

    // WHEN
    await handlePullRequest(context)

    // THEN
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers).toHaveLength(2)
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[0]).toMatch(
      /group1/
    )
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[1]).toMatch(
      /group2/
    )
    expect(addAssigneesSpy).not.toBeCalled()
  })

  test('adds all reviewers from a group that has less members than the number of reviews requested', async () => {
    // MOCKS
    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')

    // GIVEN
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: false,
        addReviewers: true,
        useReviewGroups: true,
        numberOfReviewers: 2,
        reviewGroups: {
          groupA: ['group1-user1', 'group1-user2', 'group1-user3'],
          groupB: ['group2-user1'],
        },
      }
    })

    // WHEN
    await handlePullRequest(context)

    // THEN
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers).toHaveLength(3)
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[0]).toMatch(
      /group1/
    )
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[1]).toMatch(
      /group1/
    )
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[2]).toMatch(
      /group2-user1/
    )
    expect(addAssigneesSpy).not.toBeCalled()
  })

  test('adds assignees to pull request from two different groups if groups are enabled and number of assignees is specified', async () => {
    // MOCKS
    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')

    // GIVEN
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: false,
        useAssigneeGroups: true,
        numberOfAssignees: 1,
        numberOfReviewers: 2,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3'],
        assigneeGroups: {
          groupA: ['group1-user1', 'group1-user2', 'group1-user3'],
          groupB: ['group2-user1'],
          groupC: ['group3-user1', 'group3-user2', 'group3-user3'],
        },
      }
    })

    // WHEN
    await handlePullRequest(context)

    // THEN
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toHaveLength(3)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[0]).toMatch(/group1/)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[1]).toMatch(/group2/)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[2]).toMatch(/group3/)
    expect(requestReviewersSpy).not.toBeCalled()
  })

  test('adds assignees to pull request from two different groups using numberOfReviewers if groups are enabled and number of assignees is not specified', async () => {
    // MOCKS
    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')

    // GIVEN
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: false,
        useAssigneeGroups: true,
        numberOfReviewers: 1,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3'],
        assigneeGroups: {
          groupA: ['group1-user1', 'group1-user2', 'group1-user3'],
          groupB: ['group2-user1'],
          groupC: ['group3-user1', 'group3-user2', 'group3-user3'],
        },
      }
    })

    // WHEN
    await handlePullRequest(context)

    // THEN
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toHaveLength(3)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[0]).toMatch(/group1/)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[1]).toMatch(/group2/)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[2]).toMatch(/group3/)
    expect(requestReviewersSpy).not.toBeCalled()
  })

  test('adds assignees to pull request from two different groups and reviewers are not specified', async () => {
    // MOCKS
    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')

    // GIVEN
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: false,
        useAssigneeGroups: true,
        numberOfAssignees: 1,
        numberOfReviewers: 2,
        assigneeGroups: {
          groupA: ['group1-user1', 'group1-user2', 'group1-user3'],
          groupB: ['group2-user1'],
          groupC: ['group3-user1', 'group3-user2', 'group3-user3'],
        },
      }
    })

    // WHEN
    await handlePullRequest(context)

    // THEN
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toHaveLength(3)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[0]).toMatch(/group1/)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[1]).toMatch(/group2/)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[2]).toMatch(/group3/)
    expect(requestReviewersSpy).not.toBeCalled()
  })

  test('adds normal reviewers and assignees from groups into the pull request', async () => {
    // MOCKS
    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')

    // GIVEN
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        useAssigneeGroups: true,
        numberOfAssignees: 1,
        numberOfReviewers: 2,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3'],
        assigneeGroups: {
          groupA: ['group1-user1', 'group1-user2', 'group1-user3'],
          groupB: ['group2-user1'],
          groupC: ['group3-user1', 'group3-user2', 'group3-user3'],
        },
        skipUsers: ['other-user'],
      }
    })

    // WHEN
    await handlePullRequest(context)

    // THEN
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toHaveLength(3)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[0]).toMatch(/group1/)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[1]).toMatch(/group2/)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[2]).toMatch(/group3/)

    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers).toHaveLength(2)
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[0]).toMatch(
      /reviewer/
    )
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[1]).toMatch(
      /reviewer/
    )
  })

  test('adds normal assignees and reviewers from groups into the pull request', async () => {
    // MOCKS
    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')

    // GIVEN
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        useReviewGroups: true,
        numberOfAssignees: 1,
        numberOfReviewers: 2,
        assignees: ['assignee1', 'assignee2', 'assignee3'],
        reviewGroups: {
          groupA: ['group1-reviewer1', 'group1-reviewer2', 'group1-reviewer3'],
          groupB: ['group2-reviewer1'],
          groupC: ['group3-reviewer1', 'group3-reviewer2', 'group3-reviewer3'],
        },
      }
    })

    // WHEN
    await handlePullRequest(context)

    // THEN
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toHaveLength(1)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[0]).toMatch(/assignee/)

    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers).toHaveLength(5)
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[0]).toMatch(
      /group1-reviewer/
    )
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[2]).toMatch(
      /group2-reviewer/
    )
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[3]).toMatch(
      /group3-reviewer/
    )
  })

  test('adds all assingnees from groups to pull requests when 0 is set to numberOfAssignees', async () => {
    // MOCKS
    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')

    // GIVEN
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        useAssigneeGroups: true,
        useReviewGroups: true,
        numberOfAssignees: 0,
        numberOfReviewers: 1,
        reviewGroups: {
          groupA: ['group1-reviewer1', 'group1-reviewer2', 'group1-reviewer3'],
          groupB: ['group2-reviewer1'],
          groupC: ['group3-reviewer1', 'group3-reviewer2', 'group3-reviewer3'],
        },
        assigneeGroups: {
          groupA: ['group1-user1', 'group1-user2'],
          groupB: ['group2-user1'],
          groupC: ['group3-user1', 'group3-user2'],
        },
      }
    })

    // WHEN
    await handlePullRequest(context)

    // THEN
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees).toHaveLength(5)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[0]).toMatch(/group1/)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[2]).toMatch(/group2/)
    expect(addAssigneesSpy.mock.calls[0][0]?.assignees?.[3]).toMatch(/group3/)

    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers).toHaveLength(3)
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[0]).toMatch(
      /group1/
    )
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[1]).toMatch(
      /group2/
    )
    expect(requestReviewersSpy.mock.calls[0][0]?.reviewers?.[2]).toMatch(
      /group3/
    )
  })

  test('skips for listed users', async () => {
    // MOCKS and STUBS
    const spy = jest.spyOn(context.log, 'info')

    context.octokit.issues = {
      addAssignees: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const addAssigneesSpy = jest.spyOn(context.octokit.issues, 'addAssignees')

    context.octokit.pulls = {
      requestReviewers: jest.fn().mockImplementation(async () => ({})),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const requestReviewersSpy = jest.spyOn(
      context.octokit.pulls,
      'requestReviewers'
    )

    // GIVEN
    context.config = jest.fn().mockImplementation(async () => {
      return {
        skipUsers: ['pr-creator'],
      }
    })

    // WHEN
    await handlePullRequest(context)

    // THEN
    expect(spy.mock.calls[0][0]).toEqual('ignore for user pr-creator')
    expect(requestReviewersSpy).not.toBeCalled()
    expect(addAssigneesSpy).not.toBeCalled()
  })
})
