FROM node:20-alpine

WORKDIR /app
ADD src /app/src
COPY .env package.json schema.prisma /app

RUN yarn
# RUN npx prisma db push

# install deps
RUN apk update && apk add bash
RUN apk add curl
RUN apk add jq

# install apibara
RUN curl -sL https://install.apibara.com | bash
RUN /root/.local/share/apibara/bin/apibara --version


ENTRYPOINT ["/root/.local/share/apibara/bin/apibara", "run", "--allow-env=.env", "--sink-id=1", "src/indexer.ts"]