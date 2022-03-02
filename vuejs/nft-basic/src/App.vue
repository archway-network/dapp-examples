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
          <p>{{nfts.market.tokens.length}} NFTs display here</p>
        </div>

      </div>
    </div>

    <!-- STATES: Mint -->
    <div class="minter" v-if="currentState == MINT">
      <h3>Minter</h3>

      <div class="minting-form">
        <div class="name">
          <label for="nft_name"><strong>Name:</strong></label>
          <input v-model="metadata.ipfsMetadata.name" name="nft_name" class="form-control" type="text" placeholder="My NFT name">
        </div>
        <div class="description">
          <label for="nft_descr"><strong>Description:</strong></label>
          <textarea v-model="metadata.ipfsMetadata.description" name="nft_descr" class="form-control"></textarea>
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
            <button class="btn btn-primary" @click="ipfsUpload();" :disabled="!files.length || !metadata.ipfsMetadata.description || !metadata.ipfsMetadata.name || isMinting">Mint NFT</button>
          </div>

        </div>
      </div>
    </div>
    
    <!-- STATES: My NFTs -->
    <div class="nfts mine" v-if="currentState == VIEW_OWNER && !selectedOwner">
      <h3>My NFTs</h3>
    </div>

    <!-- STATES: View NFTs of Owner -->
    <div class="nfts address" v-if="currentState == VIEW_OWNER && selectedOwner">
      <h3>{{selectedOwner}}'s NFTs</h3>
    </div>
    
    <!-- Loading -->
    <div class="loading" v-if="loading.status">
      <p v-if="loading.msg">{{loading.msg}}</p>
    </div>

    <div class="logs" v-if="logs.length">
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
import { calculateFee, GasPrice } from "@cosmjs/stargate";
import { ConstantineInfo } from './chain.info.constantine';
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
    counter: null,
    wasmClient: null,
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
    currentState: MARKET,
    selectedOwner: null,
    isMinting: false,
    nfts: {
      user: null,
      market: null
    },
    ipfs: ipfsClient.IPFS,
    metadata: {
      tokenId: null,
      uri: null,
      ipfsMetadata: {
        name: null,
        description: null,
        image: null,
        date: null
      }
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
              this.wasmClient = await SigningCosmWasmClient.connectWithSigner(this.rpc, this.offlineSigner);
              this.accounts = await this.offlineSigner.getAccounts();

              console.log('Wallet connected', {
                offlineSigner: this.offlineSigner,
                wasmClient: this.wasmClient,
                accounts: this.accounts,
                chain: this.chainMeta
              });
              // Query ref.
              this.handlers.query = this.wasmClient.queryClient.wasm.queryContractSmart;
              // Gas
              this.gas.price = GasPrice.fromString('0.002uconst');
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
          this.nfts.market = await this.getNfts();
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
          if (account == this.accounts[0].address) {
            // XXX TODO: Fix this query
            // this.nfts.user = await this.getNftsOfOwner();
          }
          break;
        }
      }
      
    },
    resetMetadataForm: function () {
      this.metadata = {
        tokenId: null,
        uri: null,
        ipfsMetadata: {
          name: null,
          description: null,
          date: null
        }
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
          
          // Metadata upload (json)
          this.loading = {
            status: true,
            msg: "Uploading metadata to IPFS..."
          };
          this.metadata.ipfsMetadata.image = IPFS_PREFIX + String(uploadResult.cid); + IPFS_SUFFIX;
          this.metadata.ipfsMetadata.date = new Date().getTime();
          
          let json = JSON.stringify(this.metadata.ipfsMetadata);
          const blob = new Blob([json], {type:"application/json"});
          const jsonReader = new FileReader();
          jsonReader.readAsDataURL(blob);

          jsonReader.onload = async (event) => {
            let jsonUploadTarget = event.target.result;
            let metadataUploadResult = await this.ipfs.upload(jsonUploadTarget);
            console.log('Successfully uploaded JSON metadata to IPFS', [metadataUploadResult, String(metadataUploadResult.cid)]);
            this.metadata.uri = IPFS_PREFIX + String(metadataUploadResult.cid) + IPFS_SUFFIX;
            
            // Mint NFT
            await this.mintNft();
          }
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
        // User NFTs
        // this.nfts.user = await this.getNftsOfOwner();
        // console.log('My NFTs', this.nfts.user);
        // All NFTs (of contract)
        this.nfts.market = await this.getNfts();//here
        console.log('All NFTs', this.nfts.market);
        // console.log('NFTs at contract '+ this.contract +' have been loaded', this.nfts);
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
      if (!address) {
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

      console.log('Entrypoint', [entrypoint, this.contract]);

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
    mintNft: async function () {//here
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
      this.nfts.market = await this.getNfts();
      console.log('this.nfts.market', this.nfts.market);

      // Prepare Tx
      let entrypoint = {
        mint: {
          token_id: String(this.nfts.market.tokens.length),
          owner: this.accounts[0].address,
          token_uri: this.metadata.uri,
          extension: null, // XXX: null prop?
        }
      };

      console.log('Entrypoint', entrypoint);

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
        let tx = await this.wasmClient.execute(this.accounts[0].address, this.contract, entrypoint, txFee);
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
        let tx = await this.wasmClient.execute(this.accounts[0].address, this.contract, entrypoint, txFee);
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
        if (this.accounts.length) {
          await this.getBalances();
        }
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
</style>