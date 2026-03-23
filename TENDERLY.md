# Running the Subgraph on a Tenderly Fork

This guide explains how to run the subgraph locally against a Tenderly Optimism mainnet fork.

## Prerequisites

- Docker and Docker Compose installed
- A Tenderly account with an Optimism mainnet fork

## Setup

### 1. Create a Tenderly Fork

1. Go to [Tenderly Dashboard](https://dashboard.tenderly.co/)
2. Navigate to **Forks** → **Create Fork**
3. Select **Optimism** as the network
4. Copy the fork RPC URL (e.g. `https://rpc.tenderly.co/fork/your-fork-id`)

### 2. Configure Environment

```bash
cp docker/.env.tenderly.example docker/.env.tenderly
```

Edit `docker/.env.tenderly` and set your `TENDERLY_FORK_RPC` URL.

### 3. Sync Contract Addresses

The Tenderly config starts from mainnet addresses, then applies any Tenderly-specific overrides from `config/tenderly-overrides.json`. Run the sync script whenever mainnet addresses change:

```bash
./scripts/sync-tenderly-config.sh
```

To override specific contract addresses for Tenderly (e.g. a redeployed contract on the fork), add them to `config/tenderly-overrides.json`:

```json
{
  "GEB_SAFE_ENGINE": "0xYourTenderlySpecificAddress...",
  "STARTING_BLOCK_NUMBER": "123456789"
}
```

The sync script merges mainnet values first, then overwrites with anything in the overrides file.

### 4. Create Docker Volume (first time only)

```bash
docker volume create --name=pgdata
```

### 5. Start the Services

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.tenderly.yml --env-file docker/.env.tenderly up
```

This starts:
- **graph-node** — connected to your Tenderly fork (port 80 for queries, 8030 for status)
- **ipfs** — local IPFS node (port 5001)
- **postgres** — database (port 5432)
- **graph-deployer** — automatically deploys the subgraph

### 6. Query the Subgraph

Once the deployer finishes and graph-node starts indexing, query at:

```
http://localhost/subgraphs/name/hai/hai
```

Example query:

```graphql
{
  systemStates(first: 1) {
    id
    totalActiveSafeCount
  }
}
```

## Resetting

To start fresh, stop the containers and remove the data:

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.tenderly.yml --env-file docker/.env.tenderly down
docker volume rm pgdata
docker volume create --name=pgdata
```

## NPM Scripts

- `npm run prepare-tenderly` — generates `subgraph.yaml` and `addresses.ts` from the Tenderly config
- `npm run sync-tenderly` — copies mainnet addresses to Tenderly config, then applies overrides from `config/tenderly-overrides.json`
