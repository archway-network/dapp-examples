import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { calculateFee, GasPrice } from "@cosmjs/stargate";

const RPC = process.env.REACT_APP_RPC_ADDRESS;
const ContractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
const BECH32_PREFIX = "archway";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contract: ContractAddress,
      counter: null,
      cwClient: null,
      gasPrice: null,
      queryHandler: null,
      loadingStatus: false,
      loadingMsg: "",
      logs: [],
      rpc: RPC,
      user: null,
      userAddress: null
    };
  };

  componentDidMount = async () => {
    // Init dApp
    await this.init();

    // Get count
    let counter = await this.getCount();
    try {
      if (!isNaN(counter.count)) {
        this.setState({ counter: counter.count });
      } else {
        console.warn('Error expected numeric value from counter, found: ', typeof counter.count);
      }
    } catch (e) {
      console.warn('Error: failed getting counter value', e);
    }
    console.log('State', this.state);
  };

  /**
     * Instances basic settings
     * @see {File} ./.env
     * @see {File} ./env.example
     * @see https://create-react-app.dev/docs/adding-custom-environment-variables/
     */
   init = async () => {
    // Handlers
    const mnemonic = process.env.REACT_APP_ACCOUNT_MNEMONIC;
    let user = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: BECH32_PREFIX });
    let userAddress = process.env.REACT_APP_ACCOUNT_ADDRESS;
    let cwClient = await SigningCosmWasmClient.connectWithSigner(this.state.rpc, user);
    let queryHandler = cwClient.queryClient.wasm.queryContractSmart;
    // Gas
    let gasPrice = GasPrice.fromString('0.002uconst');

    // Update state
    this.setState({
      user: user,
      userAddress: userAddress,
      cwClient: cwClient,
      queryHandler: queryHandler,
      gasPrice: gasPrice
    });

    // Debug
    console.log('dApp Initialized', {
      user: this.state.user,
      client: this.state.cwClient,
      queryHandler: this.state.queryHandler,
      gasPrice: this.state.gasPrice
    });
  }

  /**
   * Query contract counter
   * @see {SigningCosmWasmClient}
   * @see https://github.com/drewstaylor/archway-template/blob/main/src/contract.rs#L66-L71
   */
  getCount = async () => {
    // SigningCosmWasmClient.query: async (address, query)
    let loading;
    loading = {
      status: true,
      msg: "Refreshing counter..."
    };
    this.setState({
      loadingStatus: loading.status,
      loadingMsg: loading.msg
    });
    let entrypoint = {
      get_count: {}
    };
    let query = await this.state.queryHandler(this.state.contract, entrypoint);
    loading = {
      status: false,
      msg: ""
    };
    this.setState({
      loadingStatus: loading.status,
      loadingMsg: loading.msg
    });
    console.log('Counter Queried', query);
    return query;
  }

  /**
   * Increment the counter
   * @see {SigningCosmWasmClient}
   * @see https://github.com/drewstaylor/archway-template/blob/main/src/contract.rs#L42
   */
  incrementCounter = async () => {
    // SigningCosmWasmClient.execute: async (senderAddress, contractAddress, msg, fee, memo = "", funds)
    if (!this.state.user) {
      console.warn('Error getting user', this.state.user);
      return;
    } else if (!this.state.userAddress) {
      console.warn('Error getting user address', this.state.userAddress);
      return;
    }
    let loading;
    loading = {
      status: true,
      msg: "Incrementing counter..."
    };
    this.setState({ 
      loadingStatus: loading.status,
      loadingMsg: loading.msg
    });
    // Prepare Tx
    let entrypoint = {
      increment: {}
    };
    let txFee = calculateFee(300_000, this.state.gasPrice); // XXX TODO: Fix gas estimation (https://github.com/cosmos/cosmjs/issues/828)
    console.log('Tx args', {
      senderAddress: this.state.userAddress, 
      contractAddress: this.state.contract, 
      msg: entrypoint, 
      fee: txFee
    });
    // Send Tx
    let tx = await this.state.cwClient.execute(this.state.userAddress, this.state.contract, entrypoint, txFee);
    console.log('Increment Tx', tx);
    // Update Logs
    if (tx.logs) {
      if (tx.logs.length) {
        tx.logs[0].type = 'increment';
        tx.logs[0].timestamp = new Date().getTime();
        this.setState({
          logs: [JSON.stringify(tx.logs, null, 2), ...this.state.logs]
        });
      }
    }
    // Refresh counter
    let counter = await this.getCount();
    let count;
    if (!isNaN(counter.count)) {
      count = counter.count;
    } else {
      count = this.state.counter;
      console.warn('Error expected numeric value from counter, found: ', typeof counter.count);
    }
    // Render updates
    loading = {
      status: false,
      msg: ""
    };
    this.setState({
      counter: count,
      loadingStatus: loading.status,
      loadingMsg: loading.msg
    });
  }

  /**
   * Reset counter to 0
   * @see {SigningCosmWasmClient}
   * @see https://github.com/drewstaylor/archway-template/blob/main/src/contract.rs#L43
   */
  resetCounter = async () => {
    // SigningCosmWasmClient.execute: async (senderAddress, contractAddress, msg, fee, memo = "", funds)
    if (!this.state.user) {
      console.warn('Error getting user account', this.state.user);
      return;
    } else if (!this.state.userAddress) {
      console.warn('Error getting user address', this.state.userAddress);
      return;
    }
    let loading;
    loading = {
      status: true,
      msg: "Resetting counter..."
    };
    this.setState({
      loadingStatus: loading.status,
      loadingMsg: loading.msg
    });
    // Prepare Tx
    let entrypoint = {
      reset: {
        count: 0
      }
    };
    let txFee = calculateFee(300_000, this.state.gasPrice); // XXX TODO: Fix gas estimation (https://github.com/cosmos/cosmjs/issues/828)
    // Send Tx
    let tx = await this.state.cwClient.execute(this.state.userAddress, this.state.contract, entrypoint, txFee);
    console.log('Reset Tx', tx);
    // Update Logs
    if (tx.logs) {
      if (tx.logs.length) {
        tx.logs[0].type = 'reset';
        tx.logs[0].timestamp = new Date().getTime();
        this.setState({
          logs: [JSON.stringify(tx.logs, null, 2), ...this.state.logs]
        });
      }
    }
    // Refresh counter
    let counter = await this.getCount();
    let count;
    if (!isNaN(counter.count)) {
      count = counter.count;
    } else {
      count = this.state.counter;
      console.warn('Error expected numeric value from counter, found: ', typeof counter.count);
    }
    // Render updates
    loading = {
      status: false,
      msg: ""
    };
    this.setState({
      counter: count,
      loadingStatus: loading.status,
      loadingMsg: loading.msg
    });
  }

  render() {
    // State
    const counter = this.state.counter;
    const loadingMsg = this.state.loadingMsg;

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

    // Output
    return (
      <div className="content">
        <img src={logo} alt="logo" />

        {/* Counter Status Display */}
        <div className="status-display">
          <ul className="status">
            <li className="counter"><strong>Counter:</strong>&nbsp;{counter}</li>
          </ul>
        </div>

        {/* Controls */}
        <div className="button-controls">
          <button id="incrementer" className="btn btn-main" onClick={this.incrementCounter}>Increment Counter</button>
          <button id="resetter" className="btn btn-alt" onClick={this.resetCounter}>Reset Counter</button>
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