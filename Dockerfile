FROM node:18-alpine

RUN apk --no-cache add git python3 make g++ && \
    npm install -g pkg

WORKDIR /notion-proxy
COPY package*.json ./
COPY src ./src

RUN npm ci
RUN pkg src/expressApp.js -o /notion-proxy/app

ENTRYPOINT [ "/notion-proxy/app" ]
