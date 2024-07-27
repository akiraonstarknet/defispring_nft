FROM quay.io/apibara/sink-postgres:latest
# RUN rm /bin/sh && ln -s /bin/bash /bin/sh

WORKDIR /app
ADD src /app/src
COPY .env package.json schema.prisma /app
COPY apibara_install.sh /app

# install deps
# RUN apt-get -y update; apt-get -y install curl
# RUN apt-get -y install jq

# install node
# RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# RUN source /root/.bashrc
# RUN /root/.nvm/nvm.sh install lts/iron

# RUN npm install -g yarn
# RUN yarn
# RUN npx prisma db push

# install apibara
# RUN chmod +x ./apibara_install.sh
# RUN ./apibara_install.sh

RUN echo "Installed apibara, checking"
RUN apt-get update
RUN apt-get install -y coreutils 
RUN ls /
RUN cd .local/share/
RUN cd .local/share/apibara/
RUN cd .local/share/apibara/bin/
RUN apibara --version
RUN /root/.local/share/apibara/bin/apibara --version
# RUN /root/.local/share/apibara/bin/apibara plugins install sink-postgres

ENTRYPOINT ["/root/.local/share/apibara/bin/apibara", "run", "--allow-env=.env", "src/indexer.ts", "--sink-id=3", "--status-server-address=0.0.0.0:1234"]