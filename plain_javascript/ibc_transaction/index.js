import { SigningArchwayClient } from '@archwayhq/arch3.js';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import Long from "long";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const network = {
    chainId: 'constantine-3',
    endpoint: 'https://rpc.constantine.archway.tech',
    prefix: 'archway',
  };

  const mnemonic = process.env.MNEMONIC;
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: network.prefix });

  const accounts = await wallet.getAccounts();

  const accountAddress = accounts[0].address;
  const destinationAddress = process.env.COSMOS_ADDRESS;
  
  const signingClient = await SigningArchwayClient.connectWithSigner(network.endpoint, wallet);

  const msgIBCTransfer = {
    typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
    value: {
      sourcePort: 'transfer',
      sourceChannel: 'channel-1', // channel of the bridge
      token: {
        denom: 'aconst',
        amount: '1000000000000000000'
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
    'auto',
    'IBC Transfer', // optional memo
  );
  
  if (broadcastResult.code !== undefined && broadcastResult.code !== 0) {
    console.log("Transaction failed:", broadcastResult.log || broadcastResult.rawLog);
  } else {
    console.log("Transaction successful:", broadcastResult.transactionHash);
  }
}

main();