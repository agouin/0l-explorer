FROM node:16-alpine
WORKDIR /code
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

ENV NODE_ENV production

RUN apk add --no-cache python3 py3-pip make g++

RUN yarn

RUN yarn next build

CMD [ "yarn", "start" ]
