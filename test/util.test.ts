import { chooseUsers, includesSkipKeywords, chooseUsersFromGroups } from '../src/util'

describe('chooseUsers', () => {
  test('returns the reviewer list without the owner', () => {
    const owner = 'owner'
    const reviewers = ['owner','reviewer1','reviewer2', 'reviewer3']
    const numberOfReviewers = 0

    const list = chooseUsers(owner, reviewers, numberOfReviewers)

    expect(list).toEqual(['reviewer1','reviewer2', 'reviewer3'])
  })

  test('returns the only other reviewer', () => {
    const owner = 'owner'
    const reviewers = ['owner','reviewer1']
    const numberOfReviewers = 1

    const list = chooseUsers(owner, reviewers, numberOfReviewers)

    expect(list).toEqual(['reviewer1'])
  })

  test('returns the reviewer list if the number of reviewers is setted', () => {
    const owner = 'owner'
    const reviewers = ['owner','reviewer1','reviewer2', 'reviewer3']
    const numberOfReviewers = 2

    const list = chooseUsers(owner, reviewers, numberOfReviewers)

    expect(list.length).toEqual(2)
  })

  test('returns the only owner if if the number of reviewers is one', () => {
    const owner = 'owner'
    const reviewers = ['owner']
    const numberOfReviewers = 0

    const list = chooseUsers(owner, reviewers, numberOfReviewers)

    expect(list.length).toEqual(1)
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

describe('chooseUsersFromGroups', () => {
  test('should return one reviewer from each group, excluding the owner', () => {
    //GIVEN
    const owner = 'owner'
    const reviewers = {
      groupA: [
        'owner',
        'reviewer1'
      ],
      groupB: [
        'reviewer2'
      ]
    }
    const numberOfReviewers = 1

    //WHEN
    const list = chooseUsersFromGroups(owner, reviewers, numberOfReviewers)

    //THEN
    expect(list).toEqual(['reviewer1', 'reviewer2'])
  })

  test('should return one reviewer from each group, including the owner if the owner is the only member of a group', () => {
    //GIVEN
    const owner = 'owner'
     const reviewers = {
      groupA: [
        'owner'
      ],
      groupB: [
        'reviewer2'
      ]
    }
    const numberOfReviewers = 1

    //WHEN
    const list = chooseUsersFromGroups(owner, reviewers, numberOfReviewers)
    
    //THEN
    expect(list.length).toEqual(2)
    expect(list).toEqual(['owner', 'reviewer2'])
  })


test('should randomly select a reviewer from each group', () => {
    //GIVEN
    const owner = 'owner'
    const reviewers = {
    groupA: [
      'owner',
      'groupA-1',
      'groupA-2'
    ],
    groupB: [
      'groupB-1',
      'groupB-2'
    ],
    groupC: [],
    groupD: [
      'groupD-1',
      'groupD-2'
    ]
  }
    const numberOfReviewers = 1

    //WHEN
    const list = chooseUsersFromGroups(owner, reviewers, numberOfReviewers)

    //THEN
    expect(list.length).toEqual(3)
    expect(list[0]).toMatch(/groupA/)
    expect(list[1]).toMatch(/groupB/)
    expect(list[2]).toMatch(/groupD/)
  })


  test('should return the only other reviewer', () => {
    //GIVEN
    const owner = 'owner'
    const reviewers = {
      groupA: [
        'owner',
        'reviewer1'
      ],
      groupB: []
    }
    const numberOfReviewers = 1

    //WHEN
    const list = chooseUsersFromGroups(owner, reviewers, numberOfReviewers)

    //THEN
    expect(list.length).toEqual(1)
    expect(list).toEqual(['reviewer1'])
  })


  test('should return the only other reviewer, even when multiple reviewers are specified', () => {
    //GIVEN
    const owner = 'owner'
    const reviewers = {
      groupA: [],
      groupB: [
        'owner',
        'reviewer1'
      ]
    }
    const numberOfReviewers = 2

    //WHEN 
    const list = chooseUsersFromGroups(owner, reviewers, numberOfReviewers)

    //THEN
    expect(list.length).toEqual(1)
    expect(list).toEqual(['reviewer1'])
  })


  test('should self assign the owner', () => {
    //GIVEN
    const owner = 'owner'
    const reviewers = {
      groupA: ['owner'],
      groupB: []
    }
    const numberOfReviewers = 1

    //WHEN 
    const list = chooseUsersFromGroups(owner, reviewers, numberOfReviewers)

    //THEN
    expect(list.length).toEqual(1)
    expect(list).toEqual(['owner'])
  })


  test('should return an empty list', () => {
    //GIVEN
    const owner = 'owner'
    const reviewers = {
      groupA: [],
      groupB: []
    }
    const numberOfReviewers = 2

    //WHEN 
    const list = chooseUsersFromGroups(owner, reviewers, numberOfReviewers)

    //THEN
    expect(list.length).toEqual(0)
    expect(list).toEqual([])
  })
})
