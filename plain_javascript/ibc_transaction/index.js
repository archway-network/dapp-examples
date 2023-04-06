import { SigningArchwayClient } from '@archwayhq/arch3.js';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";
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

  const accountAddress = process.env.ARCHWAY_ADDRESS;
  const destinationAddress = process.env.COSMOS_ADDRESS;
  
  const signingClient = await SigningArchwayClient.connectWithSigner(network.endpoint, wallet, {
    gasPrice: GasPrice.fromString('0.02uconst'),
    prefix: network.prefix,
  });

  const msgIBCTransfer = {
    typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
    value: {
      sourcePort: 'transfer',
      sourceChannel: 'channel-9', // channel of the bridge
      token: {
        denom: 'uconst',
        amount: '1000'
      },
      sender: accountAddress,
      receiver: destinationAddress,
      // Timeout is in nanoseconds, you can also just send Long.UZERO for default timeout
      timeoutTimestamp: Long.fromNumber(Date.now() + 600_000).multiply(1_000_000),
    },
  };

  const broadcastResult = await signingClient.signAndBroadcast(
    accountAddress,
    [msgIBCTransfer],
    'auto', // Can manually set fee here if needed
    'IBC Transfer', // optional memo
  );
  
  if (broadcastResult.code == 0) {
    console.log("Transaction successful:", broadcastResult.transactionHash);
  } else {
    console.log("Transaction failed:", broadcastResult.rawLog);
  }
}

main();