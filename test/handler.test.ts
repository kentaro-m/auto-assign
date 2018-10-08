import { Context } from 'probot'
import { handlePullRequest } from '../src/handler'
import { PullRequest } from '../src/pull_request'

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
          title: 'test'
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

  test('throws the error if the configuration file is failed to load', async () => {
    try {
      // tslint:disable-next-line:no-empty
      context.config = jest.fn().mockImplementation(async () => {})
      await handlePullRequest(context)
    } catch (error) {
      expect(error).toEqual(new Error('the configuration file failed to load'))
    }
  })

  test('exits the process if the PR includes skip words in the title', async () => {
    const spy = jest.spyOn(context, 'log')

    event.payload.pull_request.title = 'wip test'
    await handlePullRequest(context)

    expect(spy).toBeCalled()
  })

  test('adds reviewers to the PR if the addReviewers flag is enabled', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: false,
        addReviewers: true,
        numberOfReviewers: 0,
        reviewers: ['reviewerA', 'reviewerB', 'reviewerC'],
        skipKeywords: ['wip']
      }
    })

    context.github.issues = {
      addAssigneesToIssue: jest.fn().mockImplementation(async () => ({}))
    } as any

    context.github.pullRequests = {
      createReviewRequest: jest.fn().mockImplementation(async () => ({}))
    } as any

    await handlePullRequest(context)

    expect(context.github.issues.addAssigneesToIssue).not.toBeCalled()
    expect(context.github.pullRequests.createReviewRequest)
      .toHaveBeenCalledWith({
        'number': '1',
        'owner': 'kentaro-m',
        'repo': 'auto-assign',
        'reviewers': ['reviewerA', 'reviewerB', 'reviewerC']
      })
  })

  test('adds assignees to the PR if the addAssignees flag is enabled', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: false,
        numberOfReviewers: 0,
        reviewers: ['maintainerX', 'maintainerY', 'maintainerZ'],
        skipKeywords: ['wip']
      }
    })

    context.github.issues = {
      addAssigneesToIssue: jest.fn().mockImplementation(async () => ({}))
    } as any

    context.github.pullRequests = {
      createReviewRequest: jest.fn().mockImplementation(async () => ({}))
    } as any

    await handlePullRequest(context)

    expect(context.github.issues.addAssigneesToIssue)
      .toHaveBeenCalledWith({
        'assignees': ['maintainerX', 'maintainerY', 'maintainerZ'],
        'number': '1',
        'owner': 'kentaro-m',
        'repo': 'auto-assign'
      })
    expect(context.github.pullRequests.createReviewRequest).not.toBeCalled()
  })

  test('adds reviewers and assignees to the PR if the addReviewers flag and the addAssignees flag are enabled', async () => {
    context.config = jest.fn().mockImplementation(async () => {
      return {
        addAssignees: true,
        addReviewers: true,
        numberOfReviewers: 0,
        reviewers: ['reviewerA', 'reviewerB', 'reviewerC'],
        skipKeywords: ['wip']
      }
    })

    context.github.issues = {
      addAssigneesToIssue: jest.fn().mockImplementation(async () => ({}))
    } as any

    context.github.pullRequests = {
      createReviewRequest: jest.fn().mockImplementation(async () => ({}))
    } as any

    await handlePullRequest(context)

    expect(context.github.issues.addAssigneesToIssue)
      .toHaveBeenCalledWith({
        'assignees': ['reviewerA', 'reviewerB', 'reviewerC'],
        'number': '1',
        'owner': 'kentaro-m',
        'repo': 'auto-assign'
      })

    expect(context.github.pullRequests.createReviewRequest)
      .toHaveBeenCalledWith({
        'number': '1',
        'owner': 'kentaro-m',
        'repo': 'auto-assign',
        'reviewers': ['reviewerA', 'reviewerB', 'reviewerC']
      })
  })

  // NOTE: Enable specification of a separate assignees list #36
  describe('enables specification of a separate assignees list', () => {
    test('adds assignees to the PR if the assigness are enabled explicitly', async () => {
      const addAssigneesSpy = jest.spyOn(PullRequest.prototype, 'addAssignees')
      const addReviewersSpy = jest.spyOn(PullRequest.prototype, 'addReviewers')

      context.config = jest.fn().mockImplementation(async () => {
        return {
          addAssignees: true,
          addReviewers: false,
          assignees: ['maintainerX', 'maintainerY'],
          numberOfAssignees: 1,
          numberOfReviewers: 2,
          reviewers: ['reviewerA', 'reviewerB', 'reviewerC'],
          skipKeywords: ['wip']
        }
      })

      context.github.issues = {
        addAssigneesToIssue: jest.fn().mockImplementation(async () => ({}))
      } as any

      context.github.pullRequests = {
        createReviewRequest: jest.fn().mockImplementation(async () => ({}))
      } as any

      await handlePullRequest(context)

      expect(addAssigneesSpy.mock.calls[0][3][0]).toMatch(/maintainer/)
      expect(addAssigneesSpy.mock.calls[0][3]).toHaveLength(1)
      expect(addReviewersSpy).not.toBeCalled()

      addAssigneesSpy.mockRestore()
      addReviewersSpy.mockRestore()
    })

    test('adds all reviewers and assignees to the PR if the values of numberOfReviewers and numberOfAssignees are set to 0', async () => {
      context.config = jest.fn().mockImplementation(async () => {
        return {
          addAssignees: true,
          addReviewers: true,
          assignees: ['maintainerX', 'maintainerY', 'maintainerZ'],
          numberOfAssignees: 0,
          numberOfReviewers: 0,
          reviewers: ['reviewerA', 'reviewerB', 'reviewerC'],
          skipKeywords: ['wip']
        }
      })

      context.github.issues = {
        addAssigneesToIssue: jest.fn().mockImplementation(async () => ({}))
      } as any

      context.github.pullRequests = {
        createReviewRequest: jest.fn().mockImplementation(async () => ({}))
      } as any

      await handlePullRequest(context)

      expect(context.github.issues.addAssigneesToIssue)
        .toHaveBeenCalledWith({
          'assignees': ['maintainerX', 'maintainerY', 'maintainerZ'],
          'number': '1',
          'owner': 'kentaro-m',
          'repo': 'auto-assign'
        })

      expect(context.github.pullRequests.createReviewRequest)
        .toHaveBeenCalledWith({
          'number': '1',
          'owner': 'kentaro-m',
          'repo': 'auto-assign',
          'reviewers': ['reviewerA', 'reviewerB', 'reviewerC']
        })
    })

    test('adds specific reviewers and assignees to the PR if the values of numberOfReviewers and numberOfAssignees are set respectively', async () => {
      const addAssigneesSpy = jest.spyOn(PullRequest.prototype, 'addAssignees')
      const addReviewersSpy = jest.spyOn(PullRequest.prototype, 'addReviewers')

      context.config = jest.fn().mockImplementation(async () => {
        return {
          addAssignees: true,
          addReviewers: true,
          assignees: ['maintainerX', 'maintainerY'],
          numberOfAssignees: 1,
          numberOfReviewers: 2,
          reviewers: ['reviewerA', 'reviewerB', 'reviewerC'],
          skipKeywords: ['wip']
        }
      })

      context.github.issues = {
        addAssigneesToIssue: jest.fn().mockImplementation(async () => ({}))
      } as any

      context.github.pullRequests = {
        createReviewRequest: jest.fn().mockImplementation(async () => ({}))
      } as any

      await handlePullRequest(context)

      expect(addAssigneesSpy.mock.calls[0][3][0]).toMatch(/maintainer/)
      expect(addAssigneesSpy.mock.calls[0][3]).toHaveLength(1)
      expect(addReviewersSpy.mock.calls[0][3][0]).toMatch(/reviewer/)
      expect(addReviewersSpy.mock.calls[0][3]).toHaveLength(2)

      addAssigneesSpy.mockRestore()
      addReviewersSpy.mockRestore()
    })
  })
})
