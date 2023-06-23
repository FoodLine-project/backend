FROM node:18.16.0

RUN mkdir -p /app
WORKDIR /app

ADD . /app/

RUN npm install --force

RUN npm run build

EXPOSE 3300

ENTRYPOINT npm run start:prod