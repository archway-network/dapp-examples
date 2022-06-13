import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import {useArchwayKeplr, CalculateFee} from "arch3.js"
import { useSnackbar } from 'notistack';



function App() {
  const { activateBrowserWallet, account, chainConfig, disconnect, client, readOnlyClient } = useArchwayKeplr();
  const [count, setCount] = useState<number>(0);
  useEffect(() => {
    
  })
  const shortenAddress = (address: string, prefix: string):string => {
    const start = address.substring(0, prefix.length + 3);
    const end = address.substring(address.length - 3);
    return(`${start}....${end}`);
  }
  const connectWallet = async () => {
    if (!account) {
      await activateBrowserWallet().then((err: string) => {
        if (!err)
        console.log("success") ;        
        else 
        console.log("err") ;
      });
    } else {
      disconnect();
      console.log("Connec") ;
    }
  }

  const executeIncrement = async() => {
    const fee = CalculateFee(1000000);
    await client.executeContract("archway1dfxl39mvqlufzsdf089u4ltlhns6scgun6vf5mkym7cy0zpsrausequkm4", {increment: {}},fee);
    let count = await readOnlyClient.queryContract("archway1dfxl39mvqlufzsdf089u4ltlhns6scgun6vf5mkym7cy0zpsrausequkm4", {get_count: {}});
    setCount(count.count);
  }

  
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
       <button onClick={connectWallet}>{account ? shortenAddress(account, chainConfig.addressPrefix) : "Connect Wallet"}</button>
       <button onClick={executeIncrement}>Increment</button>
       <p>Count: {count}</p>
        <a
          className="App-link"
          href="https://archway.io/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit Archway
        </a>
      </header>
    </div>
  );
}

export default App;
