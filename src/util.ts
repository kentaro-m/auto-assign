import _ from 'lodash'

export function chooseUsers (owner: string, candidates: string[], desiredNumber: number): string[] {

  // self-assign
  if (candidates.length === 1) {
    return candidates
  }

  const withoutOwner = candidates.filter(
    reviewer => owner !== reviewer
  )

  // all-assign
  if (desiredNumber === 0) {
    return withoutOwner
  }

  return _.sampleSize(withoutOwner, desiredNumber)
}

export function includesSkipKeywords (title: string, skipKeywords: string[]): boolean {
  for (const skipKeyword of skipKeywords) {
    if (title.toLowerCase().includes(skipKeyword.toLowerCase()) === true) {
      return true
    }
  }

  return false
}

export function selectUsersFromGroups (owner: string, groups: string[][], desiredNumber: number): string[] {
  let users: string[] = [];
  for(let group of groups) {
    users = users.concat(chooseUsers(owner, group, desiredNumber))
  }
  return users;
}
