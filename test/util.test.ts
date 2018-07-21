import { createReviewerList, includesSkipKeywords } from '../src/util'

describe('createReviewerList', () => {
  test('create a reviewer list without the owner', () => {
    const owner = 'owner'
    const reviewers = ['owner','reviewer1','reviewer2', 'reviewer3']
    const numberOfReviewers = 0

    const list = createReviewerList(owner, reviewers, numberOfReviewers)

    expect(list).toEqual(['reviewer1','reviewer2', 'reviewer3'])
  })

  test('create a reviewer list if the number of reviewers is setted', () => {
    const owner = 'owner'
    const reviewers = ['owner','reviewer1','reviewer2', 'reviewer3']
    const numberOfReviewers = 2

    const list = createReviewerList(owner, reviewers, numberOfReviewers)

    expect(list.length).toEqual(2)
  })
})

describe('includesSkipKeywords', () => {
  test('should return true if the pull request title includes skip word', () => {
    const title = 'WIP add a new feature'
    const skipWords = ['wip']

    const contains = includesSkipKeywords(title, skipWords)

    expect(contains).toEqual(true)
  })

  test('should return false if the pull request title does not include skip word', () => {
    const title = 'add a new feature'
    const skipWords = ['wip']

    const contains = includesSkipKeywords(title, skipWords)

    expect(contains).toEqual(false)
  })
})
