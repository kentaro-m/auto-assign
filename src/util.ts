export function createReviewerList (owner: string, reviewers: string[]): string[] {
  return reviewers.filter(
    reviewer => owner !== reviewer
  )
}

export function includesSkipKeywords (title: string, skipKeywords: string[]): boolean {
  for (const skipKeyword of skipKeywords) {
    if (title.toLowerCase().includes(skipKeyword.toLowerCase()) === true) {
      return true
    }
  }

  return false
}
