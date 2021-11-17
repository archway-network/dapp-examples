# Archway dApp Examples

Here you'll find example frontend dApps for the starter code templates available in the [Archway Developer CLI](https://github.com/archway-network/archway-cli)

Frontends currently are available in either [Vue.js](https://vuejs.org/) or [React](https://reactjs.org/) variants.

## dApps Included
- [Increment Template](https://github.com/archway-network/archway-templates/tree/main/increment)
  - [Vue version](https://github.com/archway-network/dApp-examples/tree/main/vuejs/increment)
  - [React version](https://github.com/archway-network/dApp-examples/tree/main/react/increment)

## Setting Environment Variables

Both Vue and React projects will require you to setup environment variables with some Archway account and RPC information.

Once you have decided which example you'd like to run, change to that directory and copy the `env.example` file to a file called `.env` and edit it with your desired settings.

Example:

```bash
cd vuejs/increment
cp env.example .env
vim .env
cat .env
# Outputs:
> VUE_APP_CONTRACT_ADDRESS="archway1c6yawecywrgu9y5lc6y79mvxgk6lx0hhehn5kn"
> VUE_APP_ACCOUNT_ADDRESS="archway14qemq0vw6y3gc3u3e0aty2e764u4gs5lndxgyk"
> VUE_APP_ACCOUNT_MNEMONIC="enlist hip relief stomach skate base shallow young switch frequent cry park" # Publicly known "Alice" mnemonic, don't actually use :)
```