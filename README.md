# Archway dApp Examples

Here you'll find example frontend dApps for the starter code templates available in the [Archway Developer CLI](https://github.com/archway-network/archway-cli)

Frontends currently are available in either [Vue.js](https://vuejs.org/) or [React](https://reactjs.org/) variants.

## dApps Included
- [Increment Template](https://github.com/archway-network/archway-templates/tree/main/increment)
  - [Vue version](https://github.com/archway-network/dApp-examples/tree/main/vuejs/increment)
  - [React version](https://github.com/archway-network/dApp-examples/tree/main/react/increment)

## Setting Environment Variables

Both Vue and React projects require you setup environment variables with some Archway account and RPC information.

When you've have decided which example you'd like to run, change to that directory and copy `env.example` to a file called `.env` and edit it with your desired settings.

Example:

```bash
git clone git@github.com:archway-network/dApp-examples.git
cd dApp-examples/vuejs/increment
cp env.example .env
vim .env
cat .env
# Example output:
> VUE_APP_RPC_ADDRESS="https://rpc.constantine-1.archway.tech:443"
> VUE_APP_CONTRACT_ADDRESS="archway1c6yawecywrgu9y5lc6y79mvxgk6lx0hhehn5kn"
> VUE_APP_ACCOUNT_ADDRESS="archway14qemq0vw6y3gc3u3e0aty2e764u4gs5lndxgyk"
> VUE_APP_ACCOUNT_MNEMONIC="mnemonic seed words go here"
```

## Why are we importing a wallet mnemonic?

Hang in there, we're working on browser extension options for connecting users to Archway dApps. We hope to have this option for you soon.

## Packages

Working in concert, the following packages provide dApp frontends with Archway capabilities:

- [@cosmjs/stargate](https://www.npmjs.com/package/@cosmjs/stargate)
- [@cosmjs/cosmwasm-stargate](https://www.npmjs.com/package/@cosmjs/cosmwasm-stargate)
- [@cosmjs/proto-signing](https://www.npmjs.com/package/@cosmjs/proto-signing)