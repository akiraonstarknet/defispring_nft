FROM ubuntu:22.04 as base
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

WORKDIR /app
ADD src /app/src
COPY .env tsconfig.json apibara.config.ts package.json schema.prisma run.sh /app/

# install deps
RUN apt-get -y update; apt-get -y install curl
RUN apt-get -y install jq
RUN apt-get install wget -y
RUN apt-get install gzip -y

# install supervisor
RUN apt-get install -y supervisor
RUN mkdir -p /var/log/supervisor

# Add NodeSource repository for the desired Node.js version (e.g., 18.x)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Install Node.js
RUN apt-get install -y nodejs

# Verify Node.js installation
RUN node -v && npm -v
RUN whereis node

# install pm2
RUN npm install -g pm2
RUN whereis pm2

# yarn install
RUN npm install -g yarn
RUN npm install -g ts-node
RUN yarn install
RUN npx prisma generate
RUN whereis yarn
WORKDIR /app

# chmod
RUN chmod +x run.sh

ENTRYPOINT ["pm2", "start", "run.sh", "--no-daemon", "--time"]