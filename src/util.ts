import _ from 'lodash'

export function chooseUsers (
  owner: string,
  sender: string,
  candidates: string[],
  desiredNumber: number
): string[] {
  // self-assign
  if (candidates.length === 1) {
    return candidates
  }

  const withoutOwnerAndSender = candidates.filter(
    reviewer => owner !== reviewer && sender !== reviewer
  )

  // all-assign
  if (desiredNumber === 0) {
    return withoutOwnerAndSender
  }

  return _.sampleSize(withoutOwnerAndSender, desiredNumber)
}

export function includesSkipKeywords (title: string, skipKeywords: string[]): boolean {
  for (const skipKeyword of skipKeywords) {
    if (title.toLowerCase().includes(skipKeyword.toLowerCase()) === true) {
      return true
    }
  }

  return false
}
