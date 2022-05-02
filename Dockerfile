FROM --platform=$BUILDPLATFORM node:16-alpine AS build

RUN apk add --no-cache python3 py3-pip make g++

ARG TARGETARCH
ARG BUILDARCH

# Install cross compile toolchain if necessary
RUN if [ "${TARGETARCH}" = "arm64" ] && [ "${BUILDARCH}" != "arm64" ]; then \
      wget -c https://musl.cc/aarch64-linux-musl-cross.tgz -O - | tar -xzvv --strip-components 1 -C /usr; \
    elif [ "${TARGETARCH}" = "amd64" ] && [ "${BUILDARCH}" != "amd64" ]; then \
      wget -c https://musl.cc/x86_64-linux-musl-cross.tgz -O - | tar -xzvv --strip-components 1 -C /usr; \
    fi

WORKDIR /code
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build, using toolchain if necessary
RUN if [ "${TARGETARCH}" = "arm64" ] && [ "${BUILDARCH}" != "arm64" ]; then \
      export CC=aarch64-linux-musl-gcc CXX=aarch64-linux-musl-g++;\
      npm config set arch arm64; \
    elif [ "${TARGETARCH}" = "amd64" ] && [ "${BUILDARCH}" != "amd64" ]; then \
      export CC=x86_64-linux-musl-gcc CXX=x86_64-linux-musl-g++; \
      npm config set arch arm64; \
    fi; \
    npm i && ./node_modules/.bin/next build

FROM node:16-alpine

COPY --from=build /code /code

WORKDIR /code

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

CMD [ "node", "index.js" ]
