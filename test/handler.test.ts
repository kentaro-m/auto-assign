import { Context } from 'probot'
import { handlePullRequest } from '../src/handler'

describe('handlePullRequest', () => {
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
            login: 'pr-creator'
          }
        },
        repository: {
          name: 'auto-assign',
          owner: {
            login: 'kentaro-m'
          }
        }
      }
    }

    context = new Context(event, {} as any, {} as any)

    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        numberOfReviewers: 0,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3'],
        skipKeywords: ['wip']
      }
    })

    context.log = jest.fn() as any
  })

  test('responds with the error if the configuration file failed to load', async () => {
    try {
      // tslint:disable-next-line:no-empty
      context.config = jest.fn().mockImplementation(async () => {})
      await handlePullRequest(context)
    } catch (error) {
      expect(error).toEqual(new Error('the configuration file failed to load'))
    }
  })

  test('exits the process if pull requests include skip words in the title', async () => {
    const spy = jest.spyOn(context, 'log')

    event.payload.pull_request.title = 'wip test'
    await handlePullRequest(context)

    expect(spy.mock.calls[0][0]).toEqual('skips adding reviewers')
  })

  test('adds reviewers to pull requests if the configuration is enabled, but no assignees', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: false,
        addReviewers: true,
        numberOfReviewers: 0,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3', 'pr-creator'],
        skipKeywords: ['wip']
      }
    })

    context.github.issues = {
      // tslint:disable-next-line:no-empty
      addAssignees: jest.fn().mockImplementation(async () => {})
    } as any

    context.github.pullRequests = {
      // tslint:disable-next-line:no-empty
      createReviewRequest: jest.fn().mockImplementation(async () => {})
    } as any

    const addAssigneesSpy = jest.spyOn(context.github.issues, 'addAssignees')
    const createReviewRequestSpy = jest.spyOn(
      context.github.pullRequests,
      'createReviewRequest'
    )

    await handlePullRequest(context)

    expect(addAssigneesSpy).not.toBeCalled()
    expect(createReviewRequestSpy.mock.calls[0][0].reviewers).toHaveLength(3)
    expect(createReviewRequestSpy.mock.calls[0][0].reviewers[0]).toMatch(
      /reviewer/
    )
  })

  test('adds reviewers to assignees to pull requests if the configuration is enabled ', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: false,
        numberOfReviewers: 0,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3', 'pr-creator'],
        skipKeywords: ['wip']
      }
    })

    context.github.issues = {
      // tslint:disable-next-line:no-empty
      addAssignees: jest.fn().mockImplementation(async () => {})
    } as any

    context.github.pullRequests = {
      // tslint:disable-next-line:no-empty
      createReviewRequest: jest.fn().mockImplementation(async () => {})
    } as any

    const addAssigneesSpy = jest.spyOn(context.github.issues, 'addAssignees')
    const createReviewRequestSpy = jest.spyOn(
      context.github.pullRequests,
      'createReviewRequest'
    )

    await handlePullRequest(context)

    expect(addAssigneesSpy.mock.calls[0][0].assignees).toHaveLength(3)
    expect(addAssigneesSpy.mock.calls[0][0].assignees[0]).toMatch(/reviewer/)
    expect(addAssigneesSpy.mock.calls[0][0].assignees).toEqual(expect.arrayContaining([
      'reviewer1', 'reviewer2', 'reviewer3'
    ]))
    expect(createReviewRequestSpy).not.toBeCalled()
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
        skipKeywords: ['wip']
      }
    })

    context.github.issues = {
      // tslint:disable-next-line:no-empty
      addAssignees: jest.fn().mockImplementation(async () => {})
    } as any

    context.github.pullRequests = {
      // tslint:disable-next-line:no-empty
      createReviewRequest: jest.fn().mockImplementation(async () => {})
    } as any

    const addAssigneesSpy = jest.spyOn(context.github.issues, 'addAssignees')
    const createReviewRequestSpy = jest.spyOn(
      context.github.pullRequests,
      'createReviewRequest'
    )

    await handlePullRequest(context)

    expect(addAssigneesSpy.mock.calls[0][0].assignees).toHaveLength(2)
    expect(addAssigneesSpy.mock.calls[0][0].assignees).toEqual(expect.arrayContaining(['assignee1', 'pr-creator']))
    expect(createReviewRequestSpy).not.toBeCalled()
  })

  test('adds assignees to pull requests using the numberOfReviewers when numberOfAssignees is unspecified', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        assignees: ['assignee1', 'assignee2', 'assignee3'],
        numberOfReviewers: 2,
        reviewers: ['reviewer1', 'reviewer2', 'reviewer3'],
        skipKeywords: ['wip']
      }
    })

    context.github.issues = {
      // tslint:disable-next-line:no-empty
      addAssignees: jest.fn().mockImplementation(async () => {})
    } as any

    context.github.pullRequests = {
      // tslint:disable-next-line:no-empty
      createReviewRequest: jest.fn().mockImplementation(async () => {})
    } as any

    const addAssigneesSpy = jest.spyOn(context.github.issues, 'addAssignees')
    const createReviewRequestSpy = jest.spyOn(
      context.github.pullRequests,
      'createReviewRequest'
    )

    await handlePullRequest(context)

    expect(addAssigneesSpy.mock.calls[0][0].assignees).toHaveLength(2)
    expect(addAssigneesSpy.mock.calls[0][0].assignees[0]).toMatch(/assignee/)
    expect(createReviewRequestSpy.mock.calls[0][0].reviewers).toHaveLength(2)
    expect(createReviewRequestSpy.mock.calls[0][0].reviewers[0]).toMatch(
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
        skipKeywords: ['wip']
      }
    })

    context.github.issues = {
      // tslint:disable-next-line:no-empty
      addAssignees: jest.fn().mockImplementation(async () => {})
    } as any

    context.github.pullRequests = {
      // tslint:disable-next-line:no-empty
      createReviewRequest: jest.fn().mockImplementation(async () => {})
    } as any

    const addAssigneesSpy = jest.spyOn(context.github.issues, 'addAssignees')
    const createReviewRequestSpy = jest.spyOn(
      context.github.pullRequests,
      'createReviewRequest'
    )

    await handlePullRequest(context)

    expect(addAssigneesSpy).not.toHaveBeenCalled()
    expect(createReviewRequestSpy).not.toHaveBeenCalled()
  })

  test('adds assignees to pull requests if throws error to add reviewers', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        assignees: ['maintainerX', 'maintainerY'],
        numberOfReviewers: 0,
        reviewers: ['reviewerA', 'reviewerB'],
        skipKeywords: ['wip']
      }
    })

    context.github.issues = {
      // tslint:disable-next-line:no-empty
      addAssignees: jest.fn().mockImplementation(async () => {})
    } as any

    context.github.pullRequests = {
      createReviewRequest: jest.fn().mockImplementation(async () => {
        throw new Error('Review cannot be requested from pull request author.')
      })
    } as any

    const spy = jest.spyOn(context.github.issues, 'addAssignees')

    await handlePullRequest(context)

    expect(spy.mock.calls[0][0].assignees).toHaveLength(2)
    expect(spy.mock.calls[0][0].assignees[0]).toMatch(/maintainer/)
  })

  test('adds reviewers to pull requests if throws error to add assignees', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        assignees: ['maintainerX', 'maintainerY'],
        numberOfReviewers: 0,
        reviewers: ['reviewerA', 'reviewerB'],
        skipKeywords: ['wip']
      }
    })

    context.github.issues = {
      addAssignees: jest.fn().mockImplementation(async () => {
        throw new Error('failed to add assignees.')
      })
    } as any

    context.github.pullRequests = {
      // tslint:disable-next-line:no-empty
      createReviewRequest: jest.fn().mockImplementation(async () => {})
    } as any

    const spy = jest.spyOn(context.github.pullRequests, 'createReviewRequest')

    await handlePullRequest(context)

    expect(spy.mock.calls[0][0].reviewers).toHaveLength(2)
    expect(spy.mock.calls[0][0].reviewers[0]).toMatch(/reviewer/)
  })
})
