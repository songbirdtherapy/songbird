FROM node:18-bullseye-slim AS build

WORKDIR /usr/src/target

RUN apt-get update && apt-get install -y ca-certificates

COPY --from=datadog/serverless-init:beta4 /datadog-init /app/datadog-init

RUN yarn set version berry && \
    yarn plugin import workspace-tools && \
    yarn config set nodeLinker node-modules

COPY package.json yarn.lock ./
COPY packages/tsconfig.base.json packages/tsconfig.base.json
COPY packages/precedent-iso packages/precedent-iso
COPY packages/api packages/api


RUN yarn workspaces focus @songbird/api && \
    yarn workspaces foreach -tvp --include @songbird/api --include @songbird/precedent-iso run build && \
    yarn cache clean;

WORKDIR "/usr/src/target/packages/api"

ENTRYPOINT ["/app/datadog-init"]

CMD ["yarn", "workspace", "@songbird/api", "run-server::prod"]
