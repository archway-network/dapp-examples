# Archway dApp Examples

Here you'll find example frontend dApps for the starter code templates available in the [Archway Developer CLI](https://github.com/archway-network/archway-cli).

Frontends currently are available in either [Vue.js](https://vuejs.org/) or [React](https://reactjs.org/) variants.

## dApps Included

- [Increment Template](https://github.com/archway-network/archway-templates/tree/main/increment)
    - [Vue.js](https://github.com/archway-network/dApp-examples/tree/main/vuejs/increment)
    - [React](https://github.com/archway-network/dApp-examples/tree/main/react/increment)
 - [NFT On-chain Metadata Template](https://github.com/archway-network/archway-templates/tree/main/cw721/on-chain-metadata)
     - [Vue.js](https://github.com/archway-network/dApp-examples/tree/main/vuejs/nft-basic)
     - [React](https://github.com/archway-network/dApp-examples/tree/main/react/nft-basic)

## Setting Environment Variables

Both Vue and React projects require you set up environment variables with some Archway account and RPC information.

When you've decided which example you'd like to run, change to that directory, copy `env.example` to a file called `.env` and edit it with your desired settings.

Example:

```bash
git clone git@github.com:archway-network/dApp-examples.git
cd dApp-examples/vuejs/increment
cp env.example .env
vim .env
cat .env
# Example output:
> VUE_APP_CONTRACT_ADDRESS="archway1c6yawecywrgu9y5lc6y79mvxgk6lx0hhehn5kn"
```

## Packages

Working together in concert, the following packages provide dApp frontends with Archway capabilities:

- [@cosmjs/stargate](https://www.npmjs.com/package/@cosmjs/stargate)
- [@cosmjs/cosmwasm-stargate](https://www.npmjs.com/package/@cosmjs/cosmwasm-stargate)
- [@cosmjs/proto-signing](https://www.npmjs.com/package/@cosmjs/proto-signing)
