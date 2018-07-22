# Probot: Auto Assign
WIP :construction_worker:

> A GitHub App built with [Probot](https://github.com/probot/probot) that adds reviewers to pull requests when pull requests are opened.

## Usage
1. Install the app. 
2. Create `.github/auto_assign.yml` in your repository.

```yaml
# Set to true to add reviewers to pull requests
addReviewers: true

# Set to true to add assignees to pull requests
addAssignees: true

# A list of reviewers to be added to pull requests (GitHub user name)
reviewers: 
  - reviewerA
  - reviewerB
  - reviewerC

# A list of keywords to be skipped the process that add reviewers if pull requests include it 
skipKeywords:
  - wip

# A number of reviewers added to the pull request
# Set 0 to add all the reviewers (default: 0)
numberOfReviewers: 0
```

## Development

```sh
# Install dependencies
npm install

# Run typescript
npm run build

# Run the bot
npm start
```

## Contributing

If you have suggestions for how kentaro-m could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2018 Kentaro Matsushita
