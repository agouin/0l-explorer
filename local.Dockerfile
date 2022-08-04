FROM node:16-alpine AS build

RUN apk add --no-cache python3 py3-pip make g++

WORKDIR /code
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

RUN npm i
RUN ./node_modules/.bin/next build

FROM node:16-alpine

COPY --from=build /code /code

WORKDIR /code

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

CMD [ "node", "index.js", "--max-old-space-size=4096" ]
