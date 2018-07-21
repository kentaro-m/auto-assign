import _ from 'lodash'

export function createReviewerList (owner: string, reviewers: string[], numberOfReviers: number): string[] {
  const prReviewers = reviewers.filter(
    reviewer => owner !== reviewer
  )

  if (numberOfReviers === 0) {
    return prReviewers
  }

  return _.sampleSize(prReviewers, numberOfReviers)
}

export function includesSkipKeywords (title: string, skipKeywords: string[]): boolean {
  for (const skipKeyword of skipKeywords) {
    if (title.toLowerCase().includes(skipKeyword.toLowerCase()) === true) {
      return true
    }
  }

  return false
}
