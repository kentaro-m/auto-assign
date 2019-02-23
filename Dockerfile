FROM node:10

LABEL "com.github.actions.name"="Auto Assign"
LABEL "com.github.actions.description"="Add reviewers/assignees to pull requests when pull requests are opened."
LABEL "com.github.actions.icon"="user-plus"
LABEL "com.github.actions.color"="blue"

LABEL "repository"="https://github.com/kentaro-m/auto-assign"
LABEL "homepage"="https://probot.github.io/apps/auto-assign/"
LABEL "maintainer"="Kentaro Matsushita"

ENV PATH=$PATH:/app/node_modules/.bin
WORKDIR /app
COPY . .
RUN npm install --production && npm run build

ENTRYPOINT ["probot", "receive"]
CMD ["/app/lib/index.js"]
