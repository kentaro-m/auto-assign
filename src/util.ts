import _ from 'lodash'

export function chooseUsers (
  candidates: string[],
  desiredNumber: number,
  filterUser: string = ''
): string[] {

  const filteredCandidates = candidates.filter(
    reviewer => {
      return reviewer !== filterUser
    }
  )

  // all-assign
  if (desiredNumber === 0) {
    return filteredCandidates
  }

  return _.sampleSize(filteredCandidates, desiredNumber)
}

export function includesSkipKeywords (title: string, skipKeywords: string[]): boolean {
  for (const skipKeyword of skipKeywords) {
    if (title.toLowerCase().includes(skipKeyword.toLowerCase()) === true) {
      return true
    }
  }

  return false
}
