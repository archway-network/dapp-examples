<template>
  <img alt="logo" src="./assets/logo.svg">
  
  <div class="content">

    <!-- Status Display / User Feedback -->
    <div class="status-display" v-if="!isNaN(counter)">
      <ul class="status">
        <li class="counter"><strong>Counter:</strong>&nbsp;{{counter}}</li>
      </ul>
    </div>

    <!-- Controls -->
    <div class="button-controls">
      <button id="incrementer" class="btn btn-main" @click="incrementCounter();">Increment Counter</button>
      <button id="resetter" class="btn btn-alt" @click="resetCounter();">Reset Counter</button>
    </div>

    <!-- Loading -->
    <div class="loading" v-if="loading.status">
      <p v-if="loading.msg">{{loading.msg}}</p>
    </div>

    <div class="logs" v-if="logs.length">
      <div v-for="(log,i) in logs" :key="i">
        <p class="label" v-if="log.timestamp">
          <strong><span v-if="log.increment">Counter Incremented&nbsp;</span><span v-if="log.reset">Counter Reset&nbsp;</span>({{log.timestamp}}):</strong>
        </p>
        <pre class="log-entry">{{ log }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { calculateFee, GasPrice } from "@cosmjs/stargate";

const RPC = process.env.VUE_APP_RPC_ADDRESS;
const ContractAddress = process.env.VUE_APP_CONTRACT_ADDRESS;
const BECH32_PREFIX = "archway";

export default {
  name: "App",
  data: () => ({
    contract: ContractAddress,
    counter: null,
    cwClient: null,
    gas: {
      price: null
    },
    handlers: {
      query: null
    },
    loading: {
      status: false,
      msg: ""
    },
    logs: [],
    rpc: RPC,
    user: null,
    userAddress: null
  }),
  mounted: async function () {
    // Init dApp
    await this.init();

    // Get count
    let counter = await this.getCount();
    if (!isNaN(counter.count)) {
      this.counter = counter.count;
    } else {
      console.warn('Error expected numeric value from counter, found: ', typeof counter.count);
    }
  },
  methods: {
    /**
     * Instances basic settings
     * @see {File} ./.env
     * @see {File} ./env.example
     * @see https://cli.vuejs.org/guide/mode-and-env.html#environment-variables
     */
    init: async function () {
      // Handlers
      const mnemonic = process.env.VUE_APP_ACCOUNT_MNEMONIC;
      this.user = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: BECH32_PREFIX });
      this.userAddress = process.env.VUE_APP_ACCOUNT_ADDRESS;
      this.cwClient = await SigningCosmWasmClient.connectWithSigner(this.rpc, this.user);
      this.handlers.query = this.cwClient.queryClient.wasm.queryContractSmart;
      // Gas
      this.gas.price = GasPrice.fromString('0.002uconst');
      // Debug
      console.log('dApp Initialized', {
        user: this.user,
        client: this.cwClient,
        handlers: this.handlers,
        gas: this.gas
      });
    },
    /**
     * Query contract counter
     * @see {SigningCosmWasmClient}
     * @see https://github.com/drewstaylor/archway-template/blob/main/src/contract.rs#L66-L71
     */
    getCount: async function () {
      // SigningCosmWasmClient.query: async (address, query)
      let entrypoint = {
        get_count: {}
      };
      this.loading = {
        status: true,
        msg: "Refreshing counter..."
      };
      let query = await this.handlers.query(this.contract, entrypoint);
      console.log('Counter Queried', query);
      this.loading.status = false;
      this.loading.msg = "";
      return query;
    },
    /**
     * Increment the counter
     * @see {SigningCosmWasmClient}
     * @see https://github.com/drewstaylor/archway-template/blob/main/src/contract.rs#L42
     */
    incrementCounter: async function () {
      // SigningCosmWasmClient.execute: async (senderAddress, contractAddress, msg, fee, memo = "", funds)
      if (!this.user) {
        console.warn('Error getting user', this.user);
        return;
      } else if (!this.userAddress) {
        console.warn('Error getting user address', this.userAddress);
        return;
      }
      // Prepare Tx
      let entrypoint = {
        increment: {}
      };
      this.loading = {
        status: true,
        msg: "Incrementing counter..."
      };
      let txFee = calculateFee(300_000, this.gas.price); // XXX TODO: Fix gas estimation (https://github.com/cosmos/cosmjs/issues/828)
      console.log('Tx args', {
        senderAddress: this.userAddress, 
        contractAddress: this.contract, 
        msg: entrypoint, 
        fee: txFee
      });
      // Send Tx
      let tx = await this.cwClient.execute(this.userAddress, this.contract, entrypoint, txFee);
      this.loading.status = false;
      this.loading.msg = "";
      console.log('Increment Tx', tx);
      // Update Logs
      if (tx.logs) {
        if (tx.logs.length) {
          this.logs.unshift({
            increment: tx.logs,
            timestamp: new Date().getTime()
          });
          console.log('Logs Updated', this.logs);
        }
      }
      // Refresh counter display
      let counter = await this.getCount();
      if (!isNaN(counter.count)) {
        this.counter = counter.count;
      } else {
        console.warn('Error expected numeric value from counter, found: ', typeof counter.count);
      }
    },
    /**
     * Reset counter to 0
     * @see {SigningCosmWasmClient}
     * @see https://github.com/drewstaylor/archway-template/blob/main/src/contract.rs#L43
     */
    resetCounter: async function () {
      // SigningCosmWasmClient.execute: async (senderAddress, contractAddress, msg, fee, memo = "", funds)
      if (!this.user) {
        console.warn('Error getting user account', this.user);
        return;
      } else if (!this.userAddress) {
        console.warn('Error getting user address', this.userAddress);
        return;
      }
      // Prepare Tx
      let entrypoint = {
        reset: {
          count: 0
        }
      };
      this.loading = {
        status: true,
        msg: "Resetting counter..."
      };
      let txFee = calculateFee(300_000, this.gas.price); // XXX TODO: Fix gas estimation (https://github.com/cosmos/cosmjs/issues/828)
      // Send Tx
      let tx = await this.cwClient.execute(this.userAddress, this.contract, entrypoint, txFee);
      console.log('Reset Tx', tx);
      this.loading.status = false;
      this.loading.msg = "";
      // Update Logs
      if (tx.logs) {
        if (tx.logs.length) {
          this.logs.unshift({
            reset: tx.logs,
            timestamp: new Date().getTime()
          });
          console.log('Logs Updated', this.logs);
        }
      }
      // Refresh counter display
      let counter = await this.getCount();
      if (!isNaN(counter.count)) {
        this.counter = counter.count;
      } else {
        console.warn('Error expected numeric value from counter, found: ', typeof counter.count);
      }
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
div.content {
  text-align: left;
  margin: auto;
  margin-top: 3em;
  width: 90vw;
  max-width: 1280px;
}
div.content ul {
  list-style: none;
  padding-left: 0;
}
button {
  margin: 1rem;
  padding: 0.25rem;
}
p.label {
  padding-bottom: 0;
  margin-bottom: 0;
}
pre {
  line-height:1.2em;
  background:linear-gradient(180deg,#ccc 0,#ccc 1.2em,#eee 0);
  background-size:2.4em 2.4em;
  background-origin:content-box;
  padding: 1em;
  text-align:justify;
  display: inline-block;
  color: #0a4862;
  background-color: #73c8eb;
  border-color: #3bb3e3;
  border-radius: 0.5em;
}
</style>
