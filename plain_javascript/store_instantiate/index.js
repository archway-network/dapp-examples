import { SigningArchwayClient } from '@archwayhq/arch3.js';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import fs from 'fs';
import * as base64js from "base64-js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const network = {
    chainId: 'constantine-3',
    endpoint: 'https://rpc.constantine.archway.tech',
    prefix: 'archway',
  };

  // Get wallet and accounts from mnemonic
  const mnemonic = process.env.MNEMONIC;
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: network.prefix });
  const accounts = await wallet.getAccounts();

  const accountAddress = accounts[0].address;
  const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS;

  const signingClient = await SigningArchwayClient.connectWithSigner(network.endpoint, wallet);

  // Upload a contract

  const wasmCode = fs.readFileSync('./hackatom.wasm');
  const encoded = Buffer.from(wasmCode, 'binary').toString('base64');
  const contractData = base64js.toByteArray(encoded);

  const uploadResult = await signingClient.upload(
    accountAddress,
    contractData,
    'auto',
    '',
  );

  if (uploadResult.code !== undefined && uploadResult.code !== 0) {
    console.log("Storage failed:", uploadResult.log || uploadResult.rawLog);
  } else {
    console.log("Storage successful:", uploadResult.transactionHash);
  }

  // Instantiate a contract

  const codeId = uploadResult.codeId;

  const msg = {
    verifier: accountAddress, 
    beneficiary: beneficiaryAddress,
  };

  const instantiateOptions = {
    memo: "Instantiating a new contract",
    funds: [
      {
        denom: 'aconst',
        amount: '1000000000000000000'
      }
    ],
    admin: accounts[0].address
  };

  const instantiateResult = await signingClient.instantiate(
    accountAddress,
    codeId,
    msg,
    'my-instance-label',
    'auto',
    instantiateOptions
  );

  if (instantiateResult.code !== undefined && instantiateResult.code !== 0) {
    console.log("Instantiation failed:", instantiateResult.log || instantiateResult.rawLog);
  } else {
    console.log("Instantiation successful:", instantiateResult.transactionHash);
  }
}

main();