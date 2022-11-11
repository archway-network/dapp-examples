<template>

  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="collapse navbar-collapse" id="navbarSupportedContent">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item">
          <button class="btn" :class="{'btn-primary': currentState == MARKET, 'btn-inverse': currentState !== MARKET}" @click="changeDisplayState(0)" :disabled="!accounts">Market</button>
        </li>
        <li class="nav-item">
          <button class="btn" :class="{'btn-primary': currentState == MINT, 'btn-inverse': currentState !== MINT}" @click="changeDisplayState(1)" :disabled="!accounts">Mint</button>
        </li>
        <li class="nav-item">
          <button class="btn" :class="{'btn-primary': currentState == VIEW_OWNER && !selectedOwner, 'btn-inverse': currentState !== VIEW_OWNER}" @click="changeDisplayState(3)" :disabled="!accounts">My NFTs</button>
        </li>
      </ul>
    </div>
  </nav>

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

    <!-- Account balance -->
    <div class="accounts" v-if="accounts">
      <div class="status status-display balances" v-if="accounts.length">
        <ul class="status accounts-list">
          <li class="accounts account-item" v-for="(account, i) in accounts" :key="i">
            <!-- Address -->
            <strong>Account:</strong>&nbsp;
            <span>{{account.address}}</span>
            <!-- Balance -->
            <div v-if="account.balance">
              <strong v-if="!isNaN(account.balance.amount)">Balance:</strong>&nbsp;
              <span v-if="!isNaN(account.balance.amount)">{{parseInt(account.balance.amount) / 100000}} {{chainMeta.currencies[0].coinDenom}}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- STATES: Market -->
    <div class="market" v-if="currentState == MARKET">
      <h3>Market</h3>

      <div class="market-items" v-if="nfts.market">
      
        <div v-if="!nfts.market.tokens.length">
          <p>There are no NFTs in this collection, try <a class="mint-now" @click="changeDisplayState(1)">minting</a> one</p>
        </div>

        <div v-if="nfts.market.tokens.length">
          <div class="card-deck">
            <div class="card" v-for="(token,i) in nfts.market.tokens" :key="i">
              <div class="wrapper" v-if="token.extension">
                <img class="card-img-top" :src="token.extension.image" v-if="token.extension.image">
                <div class="card-body">
                  <h5 class="card-title" v-if="token.extension.name">{{token.extension.name}}</h5>
                  <p class="card-text" v-if="token.extension.description">{{token.extension.description}}</p>
                  <div class="id" v-if="token.id">
                    <p><strong>Token ID:</strong> {{token.id}}</p>
                  </div>
                  <div class="owner" v-if="token.owner">
                    <p>
                      <strong>Owned by:</strong>&nbsp;
                      <span v-if="token.owner !== accounts[0].address">{{token.owner}}</span>
                      <span v-if="token.owner == accounts[0].address">You</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- STATES: Mint -->
    <div class="minter" v-if="currentState == MINT">
      <h3>Minter</h3>

      <div class="minting-form">
        <div class="name">
          <label for="nft_name"><strong>Name:</strong></label>
          <input v-model="metadata.name" name="nft_name" class="form-control" type="text" placeholder="My NFT name">
        </div>
        <div class="description">
          <label for="nft_descr"><strong>Description:</strong></label>
          <textarea v-model="metadata.description" name="nft_descr" class="form-control"></textarea>
        </div>
        
        <div class="image">
          <p class="art">
            <label><strong>Art:</strong></label><br/>
            <span style="font-style:italic;">*accepted file types: png, gif, jpeg</span>
          </p>
          <div class="dropzone" :class="{ok: files.length, waiting: !files.length}" @dragover="dragover" @dragleave="dragleave" @drop="drop">
            <input 
              type="file" 
              name="fields[assetsFieldHandle][]" 
              id="assetsFieldHandle" 
              class="hidden" 
              @change="onChange" 
              ref="file" 
              accept="image/png, image/gif, image/jpeg"
            />
            <label for="assetsFieldHandle" class="block cursor-pointer">
              <div v-if="!files.length">
                <p class="instr-t">Drag and drop NFT art here</p>
              </div>
            </label>
            
            <ul class="files-list-ul" v-cloak>
              <li class="text-sm p-1" v-for="(file,i) in files" :key="i">
                <p>{{file.name }}</p>
                <button class="btn btn-danger btn-reset" type="button" @click="clearFiles();" title="Remove file">Reset</button>
              </li>
            </ul>
          </div>

          <div class="controls minting-controls">
            <button class="btn btn-primary" @click="ipfsUpload();" :disabled="!files.length || !metadata.description || !metadata.name || isMinting">Mint NFT</button>
          </div>

        </div>
      </div>
    </div>
    
    <!-- STATES: My NFTs -->
    <div class="nfts mine" v-if="currentState == VIEW_OWNER && !selectedOwner">
      <h3>My NFTs</h3>

      <div v-if="nfts.market.tokens.length">
        <div class="card-deck">
          <div class="card" v-for="(token,i) in myNfts" :key="i">
            <img class="card-img-top" :src="token.extension.image" v-if="token.extension.image">
            <div class="card-body">
              <h5 class="card-title" v-if="token.extension.name">{{token.extension.name}}</h5>
              <p class="card-text" v-if="token.extension.description">{{token.extension.description}}</p>
              <div class="id" v-if="token.id">
                <p><strong>Token ID:</strong> {{token.id}}</p>
              </div>
              <div class="owner" v-if="token.owner">
                <p>
                  <strong>Owned by:</strong>&nbsp;<span>You</span>
                </p>
              </div>
              <div class="controls transfer-controls">
                <button class="btn btn-primary btn-send" @click="transferring.tokenId = token.id" v-if="transferring.tokenId !== token.id">Send</button>
                <button class="btn btn-danger btn-cancel" @click="transferring.tokenId = null;" v-if="transferring.tokenId == token.id">Cancel</button>
                <!-- Transfer NFT -->
                <div :class="'transfer transfer-'+i" v-if="transferring.tokenId == token.id">
                  <!-- Token: ID -->
                  <label :for="'nft_id'+i"><strong>ID:</strong></label>
                  <input v-model="transferring.tokenId" :name="'nft_id_'+i" class="form-control" type="text" readonly>
                  <!-- Token: Receiving Address -->
                  <label class="recipient" :for="'nft_transfer_'+i"><strong>Recipient:</strong></label>
                  <input v-model="transferring.recipient" :name="'nft_transfer_'+i" class="form-control" type="text" placeholder="archway1f395p0gg67mmfd5zcqvpnp9cxnu0hg6r9hfczq">
                  <button class="btn btn-primary btn-send" :disabled="!transferring.recipient || !transferring.tokenId || isSending" @click="handleTransfer();">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- STATES: View NFTs of Owner -->
    <div class="nfts address" v-if="currentState == VIEW_OWNER && selectedOwner">
      <h3>{{selectedOwner}}'s NFTs</h3>
    </div>
    
    <!-- Loading -->
    <div class="loading" v-if="loading.status">
      <p v-if="loading.msg">{{loading.msg}}</p>
    </div>

    <div class="controls logs" v-if="logs.length && !showLogs">
      <button class="btn btn-inverse" @click="showLogs = true;">Show Logs</button>
    </div>

    <div class="logs" v-if="logs.length && showLogs">
      <div class="controls">
        <button class="btn btn-inverse" @click="showLogs = false;">Hide Logs</button>
      </div>
      <div v-for="(log,i) in logs" :key="i">
        <p class="label" v-if="log.timestamp">
          <strong>
            <span v-if="log.mint">Minted NFT&nbsp;</span>
            <span v-if="log.transfer">Transferred NFT:&nbsp;</span>({{log.timestamp}}):
          </strong>
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
import axios from 'axios';
import ipfsClient from './ipfs';

const RPC = ConstantineInfo.rpc;
const ContractAddress = process.env.VUE_APP_CONTRACT_ADDRESS;

const IPFS_PREFIX = 'ipfs://';
const IPFS_SUFFIX = '/';

const POSSIBLE_STATES = ['market','mint','token','owner'];
const MARKET = 0;
const MINT = 1;
const VIEW_TOKEN = 2;
const VIEW_OWNER = 3;

export default {
  name: "App",
  data: () => ({
    MARKET: MARKET,
    MINT: MINT,
    VIEW_TOKEN: VIEW_TOKEN,
    VIEW_OWNER: VIEW_OWNER,
    contract: ContractAddress,
    wasmClient: null,
    axios: axios,
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
    showLogs: true,
    rpc: RPC,
    ipfs: ipfsClient.IPFS,
    accounts: null,
    states: POSSIBLE_STATES,
    currentState: MARKET,
    selectedOwner: null,
    isMinting: false,
    isSending: false,
    nfts: {
      user: null,
      market: null,
      metadata: {}
    },
    metadata: {
      name: null,
      description: null,
      image: null
    },
    transferring: {
      recipient: null,
      tokenId: null
    },
    files: [],
    image: null
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
              this.wasmClient = await SigningCosmWasmClient.connectWithSigner(
                this.rpc, 
                this.offlineSigner, 
                { gasPrice:  this.gas.price }
              );
              this.accounts = await this.offlineSigner.getAccounts();

              console.log('Wallet connected', {
                offlineSigner: this.offlineSigner,
                wasmClient: this.wasmClient,
                accounts: this.accounts,
                chain: this.chainMeta
              });
              // Query ref.
              this.handlers.query = this.wasmClient.queryClient.wasm.queryContractSmart;
              // Debug
              console.log('dApp Initialized', {
                user: this.accounts[0].address,
                client: this.wasmClient,
                handlers: this.handlers,
                gas: this.gas
              });

              // Constantine account balances ('uconst')
              if (this.accounts.length) {
                await this.getBalances();
              }

              // User and market NFTs
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
    changeDisplayState: async function (state = 0, account = null) {
      if (typeof state !== 'number') {
        return;
      } else if (state < 0 || state > (this.states.length - 1)) {
        console.warn('An invalid state was selected. State must be an integer within range 0 and ' + (this.states.length - 1), state);
        return;
      }

      this.selectedOwner = (account) ? account : null;
      this.currentState = state;

      switch (state) {
        case MARKET: {
          this.loadNfts();
          break;
        }
        case MINT: {
          this.resetMetadataForm();
          break;
        }
        case VIEW_TOKEN: {
          break;
        }
        case VIEW_OWNER: {
          console.log('Viewing NFTs of owner', account);
          break;
        }
      }
      
    },
    resetMetadataForm: function () {
      this.metadata = {
        image: null,
        name: null,
        description: null,
      };
      this.files = [];
      this.image = null;
      this.isMinting = false;
    },
    onChange: function () {
      this.files = this.$refs.file.files;
      console.log('(onChange) Files:', this.files);
    },
    clearFiles: function () {
      this.files = [];
    },
    dragover(event) {
      event.preventDefault();
      if (!event.currentTarget.classList.contains('ok')) {
        event.currentTarget.classList.add('hovering');
      }
    },
    dragleave(event) {
      event.currentTarget.classList.remove('hovering');
    },
    drop(event) {
      event.preventDefault();
      this.$refs.file.files = event.dataTransfer.files;
      this.onChange();
    },
    ipfsUpload: async function () {
      if (!this.files.length) {
        console.warn('Nothing to upload to IPFS');
        return;
      }

      this.loading = {
        status: true,
        msg: "Uploading art to IPFS..."
      };

      this.isMinting = true;

      // Art upload
      const reader = new FileReader(); 
      let file = this.files[0];
      reader.readAsDataURL(file);

      reader.onload = async (event) => {
        this.image = event.target.result;
        // console.log('reader.onload', {
        //   reader: reader,
        //   result: reader.result,
        //   image: this.image
        // });
        try {
          let uploadResult = await this.ipfs.upload(this.image);
          console.log('Successfully uploaded art', [uploadResult, String(uploadResult.cid)]);
          this.metadata.image = IPFS_PREFIX + String(uploadResult.cid) + IPFS_SUFFIX;
          await this.mintNft();
        } catch (e) {
          console.error('Error uploading file to IPFS: ', e);
          this.loading.status = false;
          this.loading.msg = "";
          return;
        }
      };
      reader.onerror = (e) => {
        console.error('Error uploading file to IPFS: ', e);
        this.loading.status = false;
        this.loading.msg = "";
        return;
      };
    },
    loadNfts: async function () {
      // Load NFTs
      try {
        // All NFTs (of contract)
        this.nfts.market = await this.getNfts();
        console.log('All NFTs', this.nfts.market);
        // console.log('NFTs at contract '+ this.contract +' have been loaded', this.nfts);

        // Iterate ID's and get token data
        await this.loadNftData();
      } catch (e) {
        console.error('Error loading NFTs', { 
          nfts: this.nfts, 
          user: this.accounts,
          error: e 
        });
      }
    },
    loadNftData: async function () {
      if (!this.nfts.market) {
        console.warn('No NFTs; nothing to query', this.nfts.market);
        return;
      } else if (!this.nfts.market.tokens) {
        console.warn('No NFTs; nothing to query', this.nfts.market);
        return;
      }

      for (let i = 0; i < this.nfts.market.tokens.length; i++) {
        let id = this.nfts.market.tokens[i];
        console.log('Requesting data for token ' + id);
        let data = await this.getTokenMeta(id);
        let resolvedMetadata = data;
        resolvedMetadata.id = id;
        this.nfts.market.tokens[i] = resolvedMetadata;
        // console.log('Data resolution', this.nfts.market.tokens);
      }

    },
    getTokenMeta: async function (tokenId = false) {
      if (!tokenId || typeof tokenId !== 'string') {
        console.warn('Invalid token ID. Token ID must be a string, but got ' + typeof tokenId);
        return;
      }

      let entrypoint = {
        nft_info: {
          token_id: tokenId
        }
      };

      this.loading = {
        status: true,
        msg: "Loading NFT data of token " + tokenId + "..."
      };

      let query = await this.handlers.query(this.contract, entrypoint);

      if (query.extension) {
        if (query.extension.image) {
          query.extension.image = query.extension.image.replace('ipfs://', this.ipfs.ipfsGateway);
        }
      }

      entrypoint = {
        owner_of: {
          token_id: tokenId
        }
      }
      let ownerQuery = await this.handlers.query(this.contract, entrypoint);
      if (ownerQuery['owner']) {
        query.owner = ownerQuery.owner;
      }
      if (ownerQuery['approvals']) {
        query.approvals = ownerQuery.approvals;
      }
      
      console.log('NFT contract succesfully queried for token ID ' + tokenId, query);

      this.loading = {
        status: false,
        msg: ""
      }

      return query;
    },
    /**
     * Load NFTs of entire marketplace
     * @see {SigningCosmWasmClient}
     * @see https://github.com/archway-network/archway-templates/blob/feature/cosmwasm-sdt-1.0.0-beta5/cw721/off-chain-metadata/src/query.rs#L107-L124
     */
    getNfts: async function () {
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

      // Refresh NFT market to get last minted ID
      // (Tx. might still fail if multiple users try to mint in the same block)
      this.loadNfts();
      // console.log('this.nfts.market', this.nfts.market);

      // Prepare Tx
      let entrypoint = {
        mint: {
          token_id: String(this.nfts.market.tokens.length),
          owner: this.accounts[0].address,
          extension: this.metadata,
        }
      };

      console.log('Entrypoint', entrypoint);

      this.loading = {
        status: true,
        msg: "Minting NFT..."
      };
      console.log('Tx args', {
        senderAddress: this.accounts[0].address, 
        contractAddress: this.contract, 
        msg: entrypoint
      });
      try {
        // Send Tx
        let tx = await this.wasmClient.execute(this.accounts[0].address, this.contract, entrypoint, "auto");
        this.loading.status = false;
        this.loading.msg = "";
        console.log('Mint Tx', tx);

        // Reset minting form
        this.resetMetadataForm();

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
        if (this.accounts.length) {
          await this.getBalances();
        }
      } catch (e) {
        console.warn('Error executing mint tx', e);
        this.loading.status = false;
        this.loading.msg = "";
      }
    },
    getBalances: async function () {
      if (!this.chainMeta) {
        return;
      } else if (!this.chainMeta['chainName']) {
        return;
      } else if (!this.chainMeta['currencies']) {
        return;
      } else if (!this.chainMeta.currencies.length) {
        return;
      }
      this.loading = {
        status: true,
        msg: "Updating account balances..."
      };
      if (this.accounts) {
        if (this.accounts.length) {
          for (let i = 0; i < this.accounts.length; i++) {
            if (this.accounts[i]['address']) {
              try {
                console.log('address', this.accounts[i].address);
                let balance = await this.wasmClient.getBalance(this.accounts[i].address, this.chainMeta.currencies[0].coinMinimalDenom);
                this.accounts[i].balance = balance;
                this.loading.status = false;
                this.loading.msg = "";
                console.log('Balance updated', this.accounts[i].balance);
              } catch (e) {
                console.warn('Error reading account address', [String(e), this.accounts[i]]);
                this.loading.status = false;
                this.loading.msg = "";
                return;
              }
            } else {
              console.warn('Failed to resolve account address at index ' + i, this.accounts[i]);
            }
          }
        } else {
          this.loading.status = false;
          this.loading.msg = "";
          console.warn('Failed to resolve Keplr wallet');
        }
      } else {
        this.loading.status = false;
        this.loading.msg = "";
        console.warn('Failed to resolve Keplr wallet');
      }
    },
    handleTransfer: async function () {
      if (!this.transferring.tokenId || !this.transferring.recipient || this.isSending) {
        console.warn('Nothing to transfer (check token ID and recipient address)', this.transferring);
        return;
      } 
      await this.transferNft(this.transferring.recipient, this.transferring.tokenId);
    },
    /**
     * Transfer an NFT to another user
     * @see {SigningCosmWasmClient}
     * @param {String} recipient : A recipient contract or wallet address
     * @param {String} tokenId : ID of the token to transferred to `recipient`
     * @see https://github.com/archway-network/archway-templates/blob/feature/cosmwasm-sdt-1.0.0-beta5/cw721/off-chain-metadata/src/msg.rs#L62-L74
     */
    transferNft: async function (recipient = null, tokenId = null) {
      // SigningCosmWasmClient.execute: async (senderAddress, contractAddress, msg, fee, memo = "", funds)
      if (!this.accounts) {
        console.warn('Error getting user', this.accounts);
        return;
      } else if (!this.accounts.length) {
        console.warn('Error getting user', this.accounts);
        return;
      } else if (!tokenId || !recipient) {
        console.warn('Nothing to transfer (check token ID and recipient address)', {token_id: tokenId, recipient: recipient});
        return;
      }
      // Prepare Tx
      let entrypoint = {
        transfer_nft: {
          recipient: recipient,
          token_id: tokenId
        }
      };
      this.isSending = true;
      this.loading = {
        status: true,
        msg: "Transferring NFT to "+ recipient +"..."
      };
      // Send Tx
      try {
        let tx = await this.wasmClient.execute(this.accounts[0].address, this.contract, entrypoint, "auto");
        console.log('Transfer Tx', tx);
        this.loading.status = false;
        this.loading.msg = "";
        this.isSending = false;

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
        // Refresh NFT collections and balances
        await this.loadNfts();
        if (this.accounts.length) {
          await this.getBalances();
        }
      } catch (e) {
        console.warn("Error executing NFT transfer", e);
        this.loading.status = false;
        this.loading.msg = "";
      }
    }
  },
  computed: {
    myNfts: function () {
      if (!this.nfts.market) {
        return [];
      } else if (!this.nfts.market.tokens) {
        return [];
      } else if (!this.nfts.market.tokens.length) {
        return [];
      } else if (!this.accounts) {
        return [];
      } else if (!this.accounts.length) {
        return [];
      }

      return this.nfts.market.tokens.filter((token) => {
        if (token.owner) {
          if (token.owner == this.accounts[0].address)
            return token;
        }
      });
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
  margin-top: calc(60px + 86px);
}
nav {
  position: absolute !important;
  top: 0;
  left: 0;
  right: 0;
}
div.content {
  text-align: left;
  margin: auto;
  margin-top: 3em;
  width: 90vw;
  max-width: 1440px;
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
div.logs {
  margin-top: 4em;
}
a.mint-now {
  text-decoration: underline !important;
  cursor: pointer;
}
div.minting-form div {
  margin-top: 0.75em;
}
.dropzone {
  border-radius: 1.5rem;
  padding: 2em;
  text-align: center;
}
.dropzone.ok {
  border: 2px dotted #ffffff;
  background: rgba(230,0,115,0.8);
  color: #ffffff;
}
.dropzone.waiting {
  border: 2px dotted #e0e0e0;
}
.dropzone.hovering {
  background: #e0e0e0;
  border-color: #000000;
  color: #000000;
}
.dropzone > label {
  margin-top: 1em;
}
[v-cloak] {
  display: none;
}
.cursor-pointer {
  cursor: pointer;
}
.files-list-ul {
  list-style: none;
}
.btn-reset {
  margin-left: 0.5em;
}
.hidden {
  display: none;
}
.card {
  min-width: 420px;
  max-width: 420px;
  margin: 15px !important;
}
.card-img-top {
  cursor: -moz-zoom-in; 
  cursor: -webkit-zoom-in;
  cursor: zoom-in;
}
.card-img-top:hover {
  position: absolute;
  top: 5%;
  transform: scale(2.5);
  z-index: 9999;
}
.btn,
.btn-send,
.btn-cancel {
  margin-left: 0;
}
label.recipient {
  margin-top: 1rem;
}
</style>
