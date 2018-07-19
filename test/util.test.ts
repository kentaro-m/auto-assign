import { createReviewerList, includesSkipKeywords } from '../src/util'

describe('createReviewerList', () => {
  test('create a reviewer list without the owner', () => {
    const owner = 'owner'
    const reviewers = ['owner','reviewer1','reviewer2']

    const list = createReviewerList(owner, reviewers)

    expect(['reviewer1','reviewer2']).toEqual(list)
  })
})

describe('includesSkipKeywords', () => {
  test('should return true if the pull request title includes skip word', () => {
    const title = 'WIP add a new feature'
    const skipWords = ['wip']

    const contains = includesSkipKeywords(title, skipWords)

    expect(true).toEqual(contains)
  })

  test('should return false if the pull request title does not include skip word', () => {
    const title = 'add a new feature'
    const skipWords = ['wip']

    const contains = includesSkipKeywords(title, skipWords)

    expect(false).toEqual(contains)
  })
})
