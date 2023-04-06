import { SigningArchwayClient } from '@archwayhq/arch3.js';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
import fs from 'fs';
import * as base64js from "base64-js";
import Long from "long";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const network = {
    chainId: 'constantine-2',
    endpoint: 'https://rpc.constantine-2.archway.tech',
    prefix: 'archway',
  };

  const mnemonic = process.env.MNEMONIC;
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: network.prefix });

  const accountAddress = process.env.ACCOUNT_ADDRESS;
  const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS;

  const signingClient = await SigningArchwayClient.connectWithSigner(network.endpoint, wallet, {
    gasPrice: GasPrice.fromString('0.02uconst'),
    prefix: network.prefix,
  });

  const wasmCode = fs.readFileSync('./hackatom.wasm');
  const encoded = Buffer.from(wasmCode, 'binary').toString('base64');
  const contractData = base64js.toByteArray(encoded);

  const msgStoreCode = {
    typeUrl: "/cosmwasm.wasm.v1.MsgStoreCode",
    value: {
      sender: accountAddress,
      wasmByteCode: contractData,
      instantiatePermission: { // optional
        permission: 3,
        //address: accountAddress,
      }
    },
  };

  const broadcastResult = await signingClient.signAndBroadcast(
    accountAddress,
    [msgStoreCode],
    'auto', // Can manually set fee here if needed
    '', // optional memo
  );

  if (broadcastResult.code == 0) {
    console.log("Storage successful:", broadcastResult.transactionHash);
  } else {
    console.log("Storage failed:", broadcastResult.rawLog);
  }

  const rawLog = JSON.parse(broadcastResult.rawLog);
  const codeId = rawLog[0].events[1].attributes.find(attr => attr.key === "code_id").value;

  const msgInstantiate = {
    typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
    value: {
      sender: accountAddress,
      admin: accountAddress,
      codeId: new Long(codeId),  // Code id that was returned on previous step (store)
      label: 'my-instance-label', // replace with any value you want
      msg: new TextEncoder().encode(  // has to be encoded in utf8
        JSON.stringify({
          verifier: accountAddress,   // initial params of contract, depends on your contract
          beneficiary: beneficiaryAddress,
        }),
      ),
      funds: [ // Funds transferred to contract, can be an empty array
        {
          denom: 'uconst',
          amount: '1000'
        }
      ]
    },
  };

  const broadcastResult2 = await signingClient.signAndBroadcast(
    accountAddress,
    [msgInstantiate],
    'auto', // Can manually set fee here if needed
    '', // optional memo
  );

  if (broadcastResult2.code == 0) {
    console.log("Instantiation successful:", broadcastResult2.transactionHash);
  } else {
    console.log("Instantiation failed:", broadcastResult2.rawLog);
  }
}

main();