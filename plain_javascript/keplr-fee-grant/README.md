# Keplr Example
This is a simple example of how a Grantee can execute a transaction via Keplr by utilizing a fee grant allowance assigned to their account.

Please note that the code assumes that the **Fee Granter** has already executed a transaction to assign an allowance to the user's account.

## Local Development

### Install dependencies

```
npm install

```

### Create a .env 

This file should be created from the `.env.example` file, which contains two variables that you need to set.

- **SMART_CONTRACT_ADDRESS**: This variable represents the address of your increment smart contract. A demo contract is set as the default value.
- **FEE_GRANTER_ADDRESS**: This variable corresponds to the address that created the fee grant allowance.

### Run development Server
```
npm run dev
```

For more details see comments in `src/main.js`.
