import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { calculateFee, GasPrice } from "@cosmjs/stargate";
import { ConstantineInfo } from './chain.info.constantine';

const RPC = ConstantineInfo.rpc;
const ContractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const IPFS_PREFIX = 'ipfs://';
const IPFS_SUFFIX = '/';

const POSSIBLE_STATES = ['market','mint','token','owner'];
const MARKET = 0;
const MINT = 1;
const VIEW_TOKEN = 2;
const VIEW_OWNER = 3;

import { IPFS } from './ipfs';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contract: ContractAddress,
      counter: null,
      cwClient: null,
      offlineSigner: null,
      chainMeta: ConstantineInfo,
      gasPrice: null,
      queryHandler: null,
      loadingStatus: false,
      loadingMsg: "",
      minting: false,
      files: null,
      image: null,
      ipfsImage: null,
      logs: [],
      nfts: null,
      nftsMetadata: null,
      rpc: RPC,
      accounts: null,
      userAddress: null,
      transferTokenId: null, 
      transferRecipient: null,
      isSending: null,
      MARKET: MARKET,
      MINT: MINT,
      VIEW_TOKEN: VIEW_TOKEN,
      VIEW_OWNER: VIEW_OWNER,
      states: POSSIBLE_STATES,
      currentState: MARKET
    };
  };

  /**
   * Instances basic settings
   * @see {File} ./.env
   * @see {File} ./env.example
   * @see https://create-react-app.dev/docs/adding-custom-environment-variables/
   */
   connectWallet = async () => {
    console.log('Connecting wallet...');
      try {
        if (window) {
          if (window['keplr']) {
            if (window.keplr['experimentalSuggestChain']) {
              await window.keplr.experimentalSuggestChain(this.state.chainMeta)
              await window.keplr.enable(this.state.chainMeta.chainId);              
              let offlineSigner = await window.getOfflineSigner(this.state.chainMeta.chainId);
              console.log('offlineSigner', offlineSigner);
              let cwClient = await SigningCosmWasmClient.connectWithSigner(this.state.rpc, offlineSigner);
              let accounts = await offlineSigner.getAccounts();
              let queryHandler = cwClient.queryClient.wasm.queryContractSmart;
              let gasPrice = GasPrice.fromString('0.002uconst');
              let userAddress = accounts[0].address;

              // Update state
              this.setState({
                accounts: accounts,
                userAddress: userAddress,
                cwClient: cwClient,
                queryHandler: queryHandler,
                gasPrice: gasPrice,
                offlineSigner: offlineSigner
              });

              // Debug
              console.log('dApp Connected', {
                accounts: this.state.accounts,
                userAddress: this.state.userAddress,
                client: this.state.cwClient,
                queryHandler: this.state.queryHandler,
                gasPrice: this.state.gasPrice,
                offlineSigner: this.state.offlineSigner
              });
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
  }


  // onChange: function () {
  //   this.files = this.$refs.file.files;
  //   console.log('(onChange) Files:', this.files);
  // },
  // clearFiles: function () {
  //   this.files = [];
  // },
  // dragover(event) {
  //   event.preventDefault();
  //   if (!event.currentTarget.classList.contains('ok')) {
  //     event.currentTarget.classList.add('hovering');
  //   }
  // },
  // dragleave(event) {
  //   event.currentTarget.classList.remove('hovering');
  // },
  // drop(event) {
  //   event.preventDefault();
  //   this.$refs.file.files = event.dataTransfer.files;
  //   this.onChange();
  // },


  ipfsUpload = async () => {
    if (!this.state.files.length) {
      console.warn('Nothing to upload to IPFS');
      return;
    }

    this.setState({
      loadingStatus: true,
      loadingMsg: "Uploading art to IPFS...",
      minting: true
    });

    // Art upload
    const reader = new FileReader(); 
    let file = this.state.files[0];
    reader.readAsDataURL(file);

    reader.onload = async (event) => {
      this.setState({
        image: event.target.result
      });
      
      try {
        let uploadResult = await IPFS.upload(this.state.image);
        console.log('Successfully uploaded art', [uploadResult, String(uploadResult.cid)]);
        this.setState({
          ipfsImage: IPFS_PREFIX + String(uploadResult.cid) + IPFS_SUFFIX
        })

        await this.mintNft();
      } catch (e) {
        console.error('Error uploading file to IPFS: ', e);
        this.setState({
          loadingStatus: false,
          loadingMsg: "",
          minting: false
        });
        return;
      }
    };
    reader.onerror = (e) => {
      console.error('Error uploading file to IPFS: ', e);
      this.setState({
        loadingStatus: false,
        loadingMsg: "",
        minting: false
      });
      return;
    };
  }

  resetMetadataForm = async () => {
    // ...
  }

  getBalances = async () => {
    if (!this.state.chainMeta) {
      return;
    } else if (!this.state.chainMeta['chainName']) {
      return;
    } else if (!this.state.chainMeta['currencies']) {
      return;
    } else if (!this.state.chainMeta.currencies.length) {
      return;
    }
    
    this.setState({
      loadingStatus: true,
      loadingMsg: "Updating account balances...",
    });

    if (this.state.accounts) {
      if (this.state.accounts.length) {
        for (let i = 0; i < this.state.accounts.length; i++) {
          if (this.accounts[i]['address']) {
            try {
              console.log('address', this.state.accounts[i].address);
              let balance = await this.cwClient.getBalance(this.state.accounts[i].address, this.state.chainMeta.currencies[0].coinMinimalDenom);
              
              let accounts = this.state.accounts;
              accountBalances[i].balance = balance;

              this.setState({
                loadingStatus: false,
                loadingMsg: "",
                accounts: accounts
              });
              console.log('Balance updated', this.state.accounts[i].balance);
            } catch (e) {
              console.warn('Error reading account address', [String(e), this.state.accounts[i]]);
              this.setState({
                loadingStatus: false,
                loadingMsg: ""
              });
              return;
            }
          } else {
            console.warn('Failed to resolve account address at index ' + i, this.state.accounts[i]);
          }
        }
      } else {
        this.setState({
          loadingStatus: false,
          loadingMsg: ""
        });
        console.warn('Failed to resolve Keplr wallet');
      }
    } else {
      this.setState({
        loadingStatus: false,
        loadingMsg: ""
      });
      console.warn('Failed to resolve Keplr wallet');
    }
  }

  loadNfts = async () => {
    // Load NFTs
    try {
      // All NFTs (of contract)
      let nfts = await this.getNfts();
      this.setState({
        nftsMarket: nfts;
      });
      console.log('All NFTs', this.state.nfts);
      // Iterate ID's and get token data
      await this.loadNftData();
    } catch (e) {
      console.error('Error loading NFTs', { 
        nfts: this.state.nfts, 
        user: this.state.accounts,
        error: e 
      });
    }
  }

  loadNftData = async () => {
    if (!this.state.nfts) {
      console.warn('No NFTs; nothing to query', this.state.nfts);
      return;
    } else if (!this.state.nfts.tokens) {
      console.warn('No NFTs; nothing to query', this.state.nfts);
      return;
    }

    let nfts = this.state.nfts;
    for (let i = 0; i < nfts.tokens.length; i++) {
      let id = nfts.tokens[i];
      console.log('Requesting data for token ' + id);
      let data = await this.getTokenMeta(id);
      let resolvedMetadata = data;
      resolvedMetadata.id = id;
      nfts.tokens[i] = resolvedMetadata;
      if (i = (nfts.tokens.length - 1)) {
        this.setState({
          nftsMarket: nfts
        })
      }
    }
  }

  getTokenMeta = async (tokenId = false) => {
    if (!tokenId || typeof tokenId !== 'string') {
      console.warn('Invalid token ID. Token ID must be a string, but got ' + typeof tokenId);
      return;
    }

    let entrypoint = {
      nft_info: {
        token_id: tokenId
      }
    };

    this.setState({
      loadingStatus: true,
      loadingMsg: "Loading NFT data of token " + tokenId + "..."
    });

    let query = await this.state.queryHandler(this.state.contract, entrypoint);

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
    let ownerQuery = await this.state.queryHandler(this.state.contract, entrypoint);
    if (ownerQuery['owner']) {
      query.owner = ownerQuery.owner;
    }
    if (ownerQuery['approvals']) {
      query.approvals = ownerQuery.approvals;
    }
    
    console.log('NFT contract succesfully queried for token ID ' + tokenId, query);

    this.setState({
      loadingStatus: false,
      loadingMsg: ""
    });

    return query;
  }

  /**
   * Load NFTs of entire marketplace
   * @see {SigningCosmWasmClient}
   * @see https://github.com/archway-network/archway-templates/blob/feature/cosmwasm-sdt-1.0.0-beta5/cw721/off-chain-metadata/src/query.rs#L107-L124
   */
  getNfts = async () => {
    let entrypoint = {
      all_tokens: {}
    };

    this.setState({
      loadingStatus: true,
      loadingMsg: "Loading all NFTs of contract "+ this.state.contract +"..."
    });

    let query = await this.state.queryHandler(this.state.contract, entrypoint);
    console.log('Market NFTs', query);
    
    this.setState({
      loadingStatus: false,
      loadingMsg: ""
    });
    
    return query;
  }

  /**
   * Mint an NFT
   * @see {SigningCosmWasmClient}
   * @see https://github.com/drewstaylor/archway-template/blob/main/src/contract.rs#L42
   */
  mintNft = async () => {
    // SigningCosmWasmClient.execute: async (senderAddress, contractAddress, msg, fee, memo = "", funds)
    if (!this.state.accounts) {
      console.warn('Error getting user', this.state.accounts);
      this.setState({
        loadingStatus: false,
        loadingMsg: "",
        minting: false
      });
      return;
    } else if (!this.state.accounts.length) {
      console.warn('Error getting user', this.state.accounts);
      this.setState({
        loadingStatus: false,
        loadingMsg: "",
        minting: false
      });
      return;
    }

    // Refresh NFT market to get last minted ID
    this.loadNfts();

    // Prepare Tx
    let entrypoint = {
      mint: {
        token_id: String(this.state.nfts.tokens.length),
        owner: this.state.accounts[0].address,
        extension: this.metadata,
      }
    };

    console.log('Entrypoint', entrypoint);

    let txFee = calculateFee(300000, this.state.gasPrice); // XXX TODO: Fix gas estimation (https://github.com/cosmos/cosmjs/issues/828)
    console.log('Tx args', {
      senderAddress: this.state.accounts[0].address, 
      contractAddress: this.state.contract, 
      msg: entrypoint, 
      fee: txFee
    });

    try {
      // Send Tx
      this.setState({
        loadingStatus: true,
        loadingMsg: "Minting nft...",
        minting: true
      });
      let tx = await this.state.cwClient.execute(this.state.accounts[0].address, this.state.contract, entrypoint, txFee);
      
      this.setState({
        loadingStatus: false,
        loadingMsg: "",
        minting: false
      });
      console.log('Mint Tx', tx);

      // Reset minting form
      this.resetMetadataForm();

      // Update Logs
      if (tx.logs) {
        if (tx.logs.length) {
          tx.logs[0].type = 'mint';
          tx.logs[0].timestamp = new Date().getTime();
          this.setState({
            logs: [JSON.stringify(tx.logs, null, 2), ...this.state.logs]
          });
        }
      
        // Refresh NFT collections (all NFTs and NFTs owned by end user)
      await this.loadNfts();
      if (this.state.accounts.length) {
        await this.getBalances();
      }
    } catch (e) {
      console.warn('Error executing mint tx', e);
      this.setState({
        loadingStatus: false,
        loadingMsg: "",
        minting: false
      });
    }
  }

  handleTransfer = async () => {
    if (!this.state.transferTokenId || !this.state.transferRecipient || this.state.isSending) {
      console.warn('Nothing to transfer (check token ID and recipient address)');
      return;
    } 
    await this.transferNft(this.state.transferRecipient, this.transferTokenId);
  }

  /**
   * Transfer an NFT to another user
   * @see {SigningCosmWasmClient}
   * @param {String} recipient : A recipient contract or wallet address
   * @param {String} tokenId : ID of the token to transferred to `recipient`
   * @see https://github.com/archway-network/archway-templates/blob/feature/cosmwasm-sdt-1.0.0-beta5/cw721/off-chain-metadata/src/msg.rs#L62-L74
   */
   transferNft = async (recipient = null, tokenId = null) => {
    // SigningCosmWasmClient.execute: async (senderAddress, contractAddress, msg, fee, memo = "", funds)
    if (!this.state.accounts) {
      console.warn('Error getting user', this.state.accounts);
      return;
    } else if (!this.state.accounts.length) {
      console.warn('Error getting user', this.state.accounts);
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

    this.setState({
      isSending: true,
      loadingStatus: true,
      loadingMsg: "Transferring NFT to "+ recipient +"...",
    });

    let txFee = calculateFee(300000, this.state.gasPrice); // XXX TODO: Fix gas estimation (https://github.com/cosmos/cosmjs/issues/828)
    // Send Tx
    try {
      let tx = await this.cwClient.execute(this.state.accounts[0].address, this.state.contract, entrypoint, txFee);
      console.log('Transfer Tx', tx);
      
      this.setState({
        isSending: false,
        loadingStatus: false,
        loadingMsg: "",
      });

      // Update logs
      if (tx.logs) {
        if (tx.logs.length) {
          tx.logs[0].type = 'transfer_nft';
          tx.logs[0].timestamp = new Date().getTime();
          this.setState({
            logs: [JSON.stringify(tx.logs, null, 2), ...this.state.logs]
          });
        }
      
        // Refresh NFT collections (all NFTs and NFTs owned by end user)
      await this.loadNfts();
      if (this.state.accounts.length) {
        await this.getBalances();
      }
    } catch (e) {
      console.warn('Error executing mint tx', e);
      this.setState({
        loadingStatus: false,
        loadingMsg: "",
        minting: false
      });
    }
  }

  render() {
    // State
    const loadingMsg = this.state.loadingMsg;
    const userAddress = this.state.userAddress;

    const userNfts = (this.state.nfts['tokens'] && userAddress) ? this.state.nfts.tokens.filter((token) => {
      if (token.owner) {
        if (token.owner == userAddress)
          return token;
      }
    }) : null;

    // Maps
    let logMeta = [];
    for (let i = 0; i < this.state.logs.length; i++) {
      let logItem = JSON.parse(this.state.logs[i]);
      let meta = {
        type: logItem[0].type,
        timestamp: logItem[0].timestamp
      };
      logMeta.push(meta);
    }
    const logItems = (this.state.logs.length) ? this.state.logs.map((log,i) =>
      <div key={logMeta[i].timestamp}>
        <p className="label">
          <strong><span>Counter {(logMeta[i].type === 'increment') ? 'Incremented' : 'Reset' }&nbsp;</span>({logMeta[i].timestamp}):</strong>
        </p>
        <pre className="log-entry" key={i}>{log}</pre>
      </div>
    ) : null;

    // Not Connected
    if (!userAddress) {
      return (
        <div className="content">
          <img src={logo} alt="logo" />

          <div className="button-controls">
            <button id="connect" className="btn btn-main" onClick={this.connectWallet}>Connect Wallet</button>
          </div>

        </div>
      );
    }

    // Connected
    return (
      <div className="content">
        <img src={logo} alt="logo" />

        {/* Counter Status Display */}
        <div className="status-display">
          <ul className="status">
            {/* <li className="counter"><strong>Counter:</strong>&nbsp;{counter}</li> */}
          </ul>
        </div>

        {/* Controls */}
        <div className="button-controls">
          {/* <button id="incrementer" className="btn btn-main" onClick={this.incrementCounter}>Increment Counter</button>
          <button id="resetter" className="btn btn-alt" onClick={this.resetCounter}>Reset Counter</button> */}
        </div>

        {/* Loading */}
        {Loading(loadingMsg)}

        {/* Logs map */}
        <div className="logs">
          <div>{logItems}</div>
        </div>

      </div>
    );
  };

}

// Conditional rendering
function Loading(msg) {
  if (!msg) {
    return;
  }
  return (
    <div className="loading">
      <p>{msg}</p>
    </div>
  );
}