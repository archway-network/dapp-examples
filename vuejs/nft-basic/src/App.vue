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

    <!-- XXX TODO: Application view states (see below) -->

    <!-- STATES: Mint -->
    <div class="minter"></div>
    <!-- STATES: My NFTs -->
    <div class="nfts mine"></div>
    <!-- STATES: View NFTs of Owner -->
    <div class="nfts address"></div>
    
    <!-- END: XXX TODO -->
    
    
    <!-- Loading -->
    <div class="loading" v-if="loading.status">
      <p v-if="loading.msg">{{loading.msg}}</p>
    </div>

    <div class="logs" v-if="logs.length">
      <div v-for="(log,i) in logs" :key="i">
        <p class="label" v-if="log.timestamp">
          <strong>
            <span v-if="log.mint">Minted NFT&nbsp;</span>
            <span v-if="log.transfer">Transferred NFT:&nbsp;</span>({{log.timestamp}}):</strong>
        </p>
        <pre class="log-entry">{{ log }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { calculateFee, GasPrice } from "@cosmjs/stargate";
import { ConstantineInfo } from './chain.info.constantine';

const RPC = ConstantineInfo.rpc;
const ContractAddress = process.env.VUE_APP_CONTRACT_ADDRESS;

const POSSIBLE_STATES = ['market','mint','token','owner'];
const MARKET = 0;
const MINT = 1;
const VIEW_TOKEN = 2;
const VIEW_OWNER = 3;

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
    accounts: null,
    states: POSSIBLE_STATES,
    currentState: POSSIBLE_STATES[0],
    selectedOwner: null,
    nfts: {
      user: null,
      market: null
    },
    metadata: {
      tokenId: null,
      uri: null,
      ipfsMetadata: {
        name: null,
        description: null,
        date: null,
        attributes: []
      }
    }
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
              this.cwClient = await SigningCosmWasmClient.connectWithSigner(this.rpc, this.offlineSigner);
              this.accounts = await this.offlineSigner.getAccounts();

              console.log('Wallet connected', {
                offlineSigner: this.offlineSigner,
                cwClient: this.cwClient,
                accounts: this.accounts,
                chain: this.chainMeta
              });
              // Query ref.
              this.handlers.query = this.cwClient.queryClient.wasm.queryContractSmart;
              // Gas
              this.gas.price = GasPrice.fromString('0.002uconst');
              // Debug
              console.log('dApp Initialized', {
                user: this.accounts[0].address,
                client: this.cwClient,
                handlers: this.handlers,
                gas: this.gas
              });

              await this.loadNfts();
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
    changeDisplayState: function (state = 0, account = null) {
      if (typeof state !== 'number') {
        return;
      } else if (state == this.currentState || state < 0 || state > (this.states.length - 1)) {
        console.warn('An invalid state was selected. State must be an integer within range 0 and ' + (this.states.length - 1));
        return;
      }

      this.selectedOwner = (account) ? account : null;
      this.currentState = state;

      if (state == MINT) {
        this.resetMetadataForm();
      }
    },
    resetMetadataForm: function () {
      this.metadata = {
        tokenId: null,
        uri: null,
        ipfsMetadata: {
          name: null,
          description: null,
          date: null,
          attributes: []
        }
      };
    },
    loadNfts: async function () {
      // Load NFTs
      try {
        // User NFTs
        this.nfts.user = await this.getNftsOfOwner();
        console.log('My NFTs', nfts.user);
        // All NFTs (of contract)
        this.nfts.market = await this.getNfts();
        console.log('All NFTs', nfts.market);
        console.log('NFTs at contract '+ this.contract +' have been loaded', this.nfts);
      } catch (e) {
        console.error('Error loading NFTs', { 
          nfts: this.nfts, 
          user: this.accounts, 
          error: e 
        });
      }
    },
    /**
     * Query contract for NFTs at address, or of the end user if no address is provided
     * @see {SigningCosmWasmClient}
     * @see https://github.com/archway-network/archway-templates/blob/feature/cosmwasm-sdt-1.0.0-beta5/cw721/off-chain-metadata/src/query.rs#L82-L105
     */
    getNftsOfOwner: async function (address = false) {
      let defaults = false;
      if (!address) {
        defaults = true;
        if (!this.accounts) {
          console.warn('User address is required; nothing to query', address, this.accounts);
          return;
        } else if (!this.accounts.length) {
          console.warn('User address is required; nothing to query', address, this.accounts);
          return;
        } else {
          address = this.accounts[0].address;
        }
      }

      let entrypoint = {
        tokens: address
      };
      this.loading = {
        status: true,
        msg: "Loading NFTs of address "+ address +"..."
      };
      let query = await this.handlers.query(this.contract, entrypoint);
      console.log('NFT contract queried using address ' + address, query);
      this.loading.status = false;
      this.loading.msg = "";
      return query;
    },
    /**
     * Load NFTs of entire marketplace
     * @see {SigningCosmWasmClient}
     * @see https://github.com/archway-network/archway-templates/blob/feature/cosmwasm-sdt-1.0.0-beta5/cw721/off-chain-metadata/src/query.rs#L107-L124
     */
    getNfts: async function (address = false) {
      let entrypoint = {
        all_tokens: {}
      };
      this.loading = {
        status: true,
        msg: "Loading all NFTs of contract "+ this.contract +"..."
      };
      let query = await this.handlers.query(this.contract, entrypoint);
      console.log('Market NFTs', query);
      this.loading.status = false;
      this.loading.msg = "";
      return query;
    },
    /**
     * Mint an NFT
     * @see {SigningCosmWasmClient}
     * @see https://github.com/drewstaylor/archway-template/blob/main/src/contract.rs#L42
     */
    mintNft: async function () {
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
        mint_msg: {
          token_id: this.metadata.tokenId,
          owner: this.accounts[0].address,
          token_uri: this.metadata.uri,
          extension: null, // XXX: null prop?
        }
      };
      this.loading = {
        status: true,
        msg: "Minting NFT..."
      };
      let txFee = calculateFee(300000, this.gas.price); // XXX TODO: Fix gas estimation (https://github.com/cosmos/cosmjs/issues/828)
      console.log('Tx args', {
        senderAddress: this.accounts[0].address, 
        contractAddress: this.contract, 
        msg: entrypoint, 
        fee: txFee
      });
      try {
        // Send Tx
        let tx = await this.cwClient.execute(this.accounts[0].address, this.contract, entrypoint, txFee);
        this.loading.status = false;
        this.loading.msg = "";
        console.log('Mint Tx', tx);
        // Update Logs
        if (tx.logs) {
          if (tx.logs.length) {
            this.logs.unshift({
              mint: tx.logs,
              timestamp: new Date().getTime()
            });
            console.log('Logs Updated', this.logs);
          }
        }
        // Refresh NFT collections (all NFTs and NFTs owned by end user)
        await this.loadNfts();
      } catch (e) {
        console.warn('Error executing mint tx', e);
        this.loading.status = false;
        this.loading.msg = "";
      }
    },
    /**
     * Utility function: takes a string as input and outputs its binary value in string format
     * This function is currently unused, but will be useful later should we decide to implement sending
     * NFTs with a memo message attached to the transaction
     * @param {String} string : A string to be converted to a binary string
     * @return {String}
     */
    binString: function (string = '') {
      return string.split('').map(function (char) {
        return char.charCodeAt(0).toString(2);
      }).join(' ');
    },
    /**
     * Transfer an NFT to another user
     * @see {SigningCosmWasmClient}
     * @param {String} recipient : A recipient contract or wallet address
     * @param {String} tokenId : ID of the token to transferred to `recipient`
     * @see https://github.com/archway-network/archway-templates/blob/feature/cosmwasm-sdt-1.0.0-beta5/cw721/off-chain-metadata/src/msg.rs#L62-L74
     */
    sendNft: async function (recipient = null, tokenId = null, msg = "You now have the melting power") {
      // SigningCosmWasmClient.execute: async (senderAddress, contractAddress, msg, fee, memo = "", funds)
      if (!this.accounts) {
        console.warn('Error getting user', this.accounts);
        return;
      } else if (!this.accounts.length) {
        console.warn('Error getting user', this.accounts);
        return;
      } else if (!token_id || !recipient) {
        console.warn('Nothing to transfer (check token ID and recipient address)', {token_id: tokenId, recipient: recipient});
        return;
      } 
      // Prepare Tx
      let entrypoint = {
        transfer_nft: {
          contract: recipient, // XXX (note): `contract` here seems ambiguous; most times it will be a wallet address (e.g. not a contract)
          token_id: tokenId
        }
      };
      this.loading = {
        status: true,
        msg: "Transferring NFT to "+ recipient +"..."
      };
      let txFee = calculateFee(300000, this.gas.price); // XXX TODO: Fix gas estimation (https://github.com/cosmos/cosmjs/issues/828)
      // Send Tx
      try {
        let tx = await this.cwClient.execute(this.accounts[0].address, this.contract, entrypoint, txFee);
        console.log('Transfer Tx', tx);
        this.loading.status = false;
        this.loading.msg = "";
        // Update Logs
        if (tx.logs) {
          if (tx.logs.length) {
            this.logs.unshift({
              transfer: tx.logs,
              timestamp: new Date().getTime()
            });
            console.log('Logs Updated', this.logs);
          }
        }
        // Refresh NFT collections (all NFTs and NFTs owned by end user)
        await this.loadNfts();
      } catch (e) {
        console.warn("Error executing NFT transfer", e);
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
