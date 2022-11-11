<template>
  <img alt="logo" src="./assets/logo.svg">
  
  <!-- Not Connected -->
  <div class="content" v-if="!accounts">
    <!-- Controls -->
    <div class="button-controls">
      <!-- Connect -->
      <button id="connect" class="btn btn-main" @click="connectWallet();">Connect Wallet</button>
    </div>
  </div>

  <!-- Connected -->
  <div class="content" v-else>

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
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import { ConstantineInfo } from './chain.info.constantine';

const RPC = ConstantineInfo.rpc;
const ContractAddress = process.env.VUE_APP_CONTRACT_ADDRESS;

export default {
  name: "App",
  data: () => ({
    contract: ContractAddress,
    counter: null,
    cwClient: null,
    chainMeta: ConstantineInfo,
    offlineSigner: null,
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
    accounts: null
  }),
  mounted: async function () {},
  methods: {
    connectWallet: async function () {
      console.log('Connecting wallet...');
      try {
        if (window) {
          if (window['keplr']) {
            if (window.keplr['experimentalSuggestChain']) {
              await window.keplr.experimentalSuggestChain(this.chainMeta)
              await window.keplr.enable(this.chainMeta.chainId);
              this.offlineSigner = await window.getOfflineSigner(this.chainMeta.chainId);
              this.gas.price = GasPrice.fromString('0.002'+this.chainMeta.currencies[0].coinMinimalDenom);
              this.cwClient = await SigningCosmWasmClient.connectWithSigner(
                this.rpc, 
                this.offlineSigner, 
                { gasPrice:  this.gas.price }
              );
              this.accounts = await this.offlineSigner.getAccounts();

              console.log('Wallet connected', {
                offlineSigner: this.offlineSigner,
                cwClient: this.cwClient,
                accounts: this.accounts,
                chain: this.chainMeta
              });
              // Query ref.
              this.handlers.query = this.cwClient.queryClient.wasm.queryContractSmart;
              // Debug
              console.log('dApp Initialized', {
                user: this.accounts[0].address,
                client: this.cwClient,
                handlers: this.handlers,
                gas: this.gas
              });

              await this.start();
            } else {
              console.warn('Error access experimental features, please update Keplr');
            }
          } else {
            console.warn('Error accessing Keplr');
          }
        } else {
          console.warn('Error parsing window object');
        }
      } catch (e) {
        console.error('Error connecting to wallet', e);
      }
    },
    start: async function () {
      // Get count
      let counter = await this.getCount();
      if (!isNaN(counter.count)) {
        this.counter = counter.count;
        console.log('Counter updated', this.counter);
      } else {
        console.warn('Error expected numeric value from counter, found: ', typeof counter.count);
      }
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
      if (!this.accounts) {
        console.warn('Error getting user', this.accounts);
        return;
      } else if (!this.accounts.length) {
        console.warn('Error getting user', this.accounts);
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
      console.log('Tx args', {
        senderAddress: this.accounts[0].address, 
        contractAddress: this.contract, 
        msg: entrypoint
      });
      try {
        // Send Tx
        let tx = await this.cwClient.execute(this.accounts[0].address, this.contract, entrypoint, "auto");
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
      } catch (e) {
        console.warn('Error executing Increment', e);
        this.loading.status = false;
        this.loading.msg = "";
      }
    },
    /**
     * Reset counter to 0
     * @see {SigningCosmWasmClient}
     * @see https://github.com/drewstaylor/archway-template/blob/main/src/contract.rs#L43
     */
    resetCounter: async function () {
      // SigningCosmWasmClient.execute: async (senderAddress, contractAddress, msg, fee, memo = "", funds)
      if (!this.accounts) {
        console.warn('Error getting user', this.accounts);
        return;
      } else if (!this.accounts.length) {
        console.warn('Error getting user', this.accounts);
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
      // Send Tx
      try {
        let tx = await this.cwClient.execute(this.accounts[0].address, this.contract, entrypoint, "auto");
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
      } catch (e) {
        console.warn("Error executing Reset", e);
        this.loading.status = false;
        this.loading.msg = "";
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
