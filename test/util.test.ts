import { chooseUsers, includesSkipKeywords } from '../src/util'

describe('chooseUsers', () => {
  test('returns the reviewer list without the PR creator', () => {
    const prCreator = 'pr-creator'
    const reviewers = ['reviewer1','reviewer2', 'reviewer3', 'pr-creator']
    const numberOfReviewers = 0

    const list = chooseUsers(reviewers, numberOfReviewers, prCreator)

    expect(list).toEqual(['reviewer1','reviewer2', 'reviewer3'])
  })

  test('returns the only other reviewer', () => {
    const prCreator = 'pr-creator'
    const reviewers = ['reviewer1']
    const numberOfReviewers = 1

    const list = chooseUsers(reviewers, numberOfReviewers, prCreator)

    expect(list).toEqual(['reviewer1'])
  })

  test('returns the reviewer list if the number of reviewers is setted', () => {
    const prCreator = 'pr-creator'
    const reviewers = ['reviewer1','reviewer2', 'reviewer3', 'pr-creator']
    const numberOfReviewers = 2

    const list = chooseUsers(reviewers, numberOfReviewers, prCreator)

    expect(list.length).toEqual(2)
  })

  test('returns empty array if the reviewer is the PR creator', () => {
    const prCreator = 'pr-creator'
    const reviewers = ['pr-creator']
    const numberOfReviewers = 0

    const list = chooseUsers(reviewers, numberOfReviewers, prCreator)

    expect(list.length).toEqual(0)
  })

  test('returns full reviewer array if not passing the user to filter out', () => {
    const reviewers = ['pr-creator']
    const numberOfReviewers = 0

    const list = chooseUsers(reviewers, numberOfReviewers)

    expect(list).toEqual(expect.arrayContaining(['pr-creator']))
  })
})

describe('includesSkipKeywords', () => {
  test('returns true if the pull request title includes skip word', () => {
    const title = 'WIP add a new feature'
    const skipWords = ['wip']

    const contains = includesSkipKeywords(title, skipWords)

    expect(contains).toEqual(true)
  })

  test('returns false if the pull request title does not include skip word', () => {
    const title = 'add a new feature'
    const skipWords = ['wip']

    const contains = includesSkipKeywords(title, skipWords)

    expect(contains).toEqual(false)
  })
})
