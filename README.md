# Archway dapp Examples

Here, you will find basic dapps that cover various Archway tools, including [arch3.js](https://archway-network.github.io/arch3.js) and the [Archway Developer CLI](https://github.com/archway-network/archway-cli).

## dapps Included

- [Increment Template](https://github.com/archway-network/archway-templates/tree/main/increment)
    - [Vue.js](https://github.com/archway-network/dapp-examples/tree/main/vuejs/increment)
    - [React](https://github.com/archway-network/dapp-examples/tree/main/react/increment)
- [NFT On-chain Metadata Template](https://github.com/archway-network/archway-templates/tree/main/cw721/on-chain-metadata)
    - [Vue.js](https://github.com/archway-network/dapp-examples/tree/main/vuejs/nft-basic)
    - [React](https://github.com/archway-network/dapp-examples/tree/main/react/nft-basic)
- [IBC Transaction](https://github.com/archway-network/dapp-examples/tree/main/plain_javascript/ibc_transaction)
- [Keplr Example](https://github.com/archway-network/dapp-examples/tree/main/plain_javascript/keplr-example)
- [Store and Instantiate](https://github.com/archway-network/dapp-examples/tree/main/plain_javascript/store_instantiate)
- [Websocket Example](https://github.com/archway-network/dapp-examples/tree/main/plain_javascript/websocket-example)

## Setting Environment Variables

In certain projects, it may be necessary to configure environment variables. In such cases, you may come across a file named `env.example`. To get started, duplicate this file and rename the duplicate as `.env`. Then, customize the `.env` file to reflect your preferred configurations.

Example:

```bash
git clone git@github.com:archway-network/dapp-examples.git
cd dapp-examples/vuejs/increment
cp env.example .env
vim .env
cat .env
# Example output:
> VUE_APP_CONTRACT_ADDRESS="archway1c6yawecywrgu9y5lc6y79mvxgk6lx0hhehn5kn"
```
