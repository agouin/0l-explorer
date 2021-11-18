# 0L Blockchain Explorer

Explore 0L addresses and transactions
React webapp using next.js

## Setup

Install [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/)

Add this useful alias for `docker-compose` so you don't have to type it all out every time
#### Permanent
```bash
echo "alias dc=\"docker-compose\"" >> ~/.bashrc
source ~/.bashrc
```

### OR
#### Temporary
```bash
alias dc="docker-compose"
```

### Initialize Database


```bash
dc up -d db #launch database only
dc run cbc yarn knex migrate:latest # initialize database
```

## Run Application

```bash
dc up
```

Now browse to [http://localhost:3025](http://localhost:3025) in your browser and begin adding your wallet public addresses.

For supported privacy coins, enter the balance of your wallet instead of an address. The balance won't dynamically update since the blockchain transactions are not public, but you can update the balance at any time.

## Add a coin

#### Add coin to `lib/coins.tsx` object
- Key will be used for database mapping. If exchange rate will be scraped from CoinMarketCap like the others, key should match CoinMarketCap URL route, e.g. `cardano` if CoinMarketCap URL is `https://coinmarketcap.com/currencies/cardano`. 
- For Cosmos (non-ATOM), Osmosis (non-OSMO), and Ethereum tokens, `hideAdd: true` should be added since they will be scraped automatically after the main coin is added.
- Add `img: true` after adding a .png file matching the key to the `public/img` directory.
- Add `urlPrefix` for a hyperlink to the blockchain explorer site for a specific wallet address.
- `canDetermineBalanceFromAddress` should be true for transparent (non-privacy) blockchains where the job can scrape the balance and exchange rate based on the wallet address. Should be false for privacy coins where exchange rate only will be scraped and balance will need to be manually updated.

#### Add job to jobs/ directory (`canDetermineBalanceFromAddress: true` only)

- Use any of the other jobs in the jobs/ directory as a template for scraping the balance for an address
- Import new job into jobs/index.js
- Add switch case to `scrapeWallet` function

#### Reload changes

- After changes are made to server-side files, re-launch docker container

```bash
dc down
dc up
```

## Re-build docker image

If node_modules are changed or Dockerfile is modified, re-build the image with:
```bash
dc build
```
