FROM node:lts-bullseye-slim

RUN apt-get update && apt-get install -y \
nscd \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

CMD [ "npm", "run", "start" ]