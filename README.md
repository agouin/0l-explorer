# 0L Blockchain Explorer

Explore 0L addresses and transactions

React webapp using [next.js](https://nextjs.org/)

## Setup

Install [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/)

## Launch Dev Environment

Set an active upstream node hostname in docker-compose.yml for `NODE_HOSTNAME`

Launch Application

```bash
docker-compose up
```

Now browse to [http://localhost:3027](http://localhost:3027) in your browser

- Frontend files have hot reload. You should see changes without needing to refresh the browser, unless it is a change to getServerSideProps (the server side render) or requires a specific sequence of events to set the proper state.

- If changes are made to server-side files, the app will restart.

```bash
docker-compose down
docker-compose up
```

## Re-build docker image

If node_modules are changed or Dockerfile is modified, re-build the image with:
```bash
docker-compose build
```

## Build for production

```bash
docker build --no-cache -t 0l-explorer .
```

Now distribute the `0lexplorer:latest` docker image to your desired container orchestration platform.
An example kubernetes template file is provided in [0l-explorer.yml](0l-explorer.yml).

Replace `$NODE_HOSTNAME$`, `$CONTAINER_IMAGE$`, `$PERMISSION_TREE_API_URL$` and `$GA_MEASUREMENT_ID$` in the template with valid values for the node to use for RPC calls, the container repository URL, the permission tree API host, and Google Analytics Measurement ID, respectively.

It can be deployed with:

```bash
kubectl apply -f 0l-explorer.yml
```

## Donations

If you would like to contribute to this project financially, please send to one of the following addresses:

- 0L (GAS) - b3b77d203bf13c97626137b2ca9d981d
- Cosmos (ATOM) - cosmos1zq3r93gs6smvxvmflwwppe930p4wcrc7nwlcp0