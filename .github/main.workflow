workflow "Test my code" {
  on = "push"
  resolves = ["npm audit"]
}

action "npm ci" {
  uses = "docker://node:10"
  runs = "npm"
  args = "ci"
}

action "npm test" {
  needs = "npm ci"
  uses = "gavinhenderson/coveralls-action@master"
  secrets = ["REPO_TOKEN"]
}

action "npm run lint" {
  needs = "npm test"
  uses = "docker://node:10-alpine"
  runs = "npm"
  args = "run lint"
}

action "npm audit" {
  needs = "npm run lint"
  uses = "docker://node:10-alpine"
  runs = "npm"
  args = "audit"
}
