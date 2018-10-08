import { chooseUsers, includesSkipKeywords } from '../src/util'

describe('chooseUsers', () => {
  test('chooses reviewers excluding the owner', () => {
    const owner = 'owner'
    const reviewers = ['owner','reviewerA','reviewerB', 'reviewerC']
    const numberOfReviewers = 0

    const list = chooseUsers(owner, reviewers, numberOfReviewers)

    expect(list).toEqual(['reviewerA','reviewerB', 'reviewerC'])
  })

  test('chooses a specified number of reviewers if numberOfReviewers is set', () => {
    const owner = 'owner'
    const reviewers = ['owner','reviewerA','reviewerB', 'reviewerC']
    const numberOfReviewers = 2

    const list = chooseUsers(owner, reviewers, numberOfReviewers)

    expect(list.length).toEqual(2)
  })

  test('chooses all reviewers if numberOfReviewers exceeds the length of reviewers', () => {
    const owner = 'owner'
    const reviewers = ['owner','reviewerA','reviewerB', 'reviewerC']
    const numberOfReviewers = 5

    const list = chooseUsers(owner, reviewers, numberOfReviewers)

    expect(list.length).toEqual(3)
  })
})

describe('includesSkipKeywords', () => {
  test('returns true if the PR title includes skip word', () => {
    const title = 'WIP add a new feature'
    const skipWords = ['wip']

    const contains = includesSkipKeywords(title, skipWords)

    expect(contains).toEqual(true)
  })

  test('returns false if the PR title does not include skip word', () => {
    const title = 'add a new feature'
    const skipWords = ['wip']

    const contains = includesSkipKeywords(title, skipWords)

    expect(contains).toEqual(false)
  })
})
