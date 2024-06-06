import { SigningArchwayClient } from '@archwayhq/arch3.js';
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import dotenv from "dotenv";
import { BasicAllowance } from "cosmjs-types/cosmos/feegrant/v1beta1/feegrant.js";

dotenv.config();

async function main() {
  const network = {
    chainId: 'constantine-3',
    endpoint: 'https://rpc.constantine.archway.io',
    prefix: 'archway',
  };

  const mnemonic = process.env.MNEMONIC;
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: network.prefix });

  const accounts = await wallet.getAccounts();

  const granterAddress = accounts[0].address;
  console.log("granterAddress: ", granterAddress);
  const granteeAddress = process.env.GRANTEE_ADDRESS;
  
  const signingClient = await SigningArchwayClient.connectWithSigner(network.endpoint, wallet);

  const basicAllowance = {
    typeUrl: "/cosmos.feegrant.v1beta1.BasicAllowance",
    value: Uint8Array.from(
      BasicAllowance.encode({
        spendLimit: [
          {
            denom: "aconst",
            amount: "5000000000000000000",
          },
        ],
      }).finish(),
    ),
  };

  const msgGrantAllowance = {
    granter: granterAddress,
    grantee: granteeAddress,
    allowance: basicAllowance,
  };

  const typeUrl = "/cosmos.feegrant.v1beta1.MsgGrantAllowance";
  const msgAny = { typeUrl, value: msgGrantAllowance };

  const broadcastResult = await signingClient.signAndBroadcast(
    granterAddress,
    [msgAny],
    'auto',
    'Fee Grant', // optional memo
  );
  
  if (broadcastResult.code !== undefined && broadcastResult.code !== 0) {
    console.log("Transaction failed:", broadcastResult.rawLog);
  } else {
    console.log("Transaction successful:", broadcastResult.transactionHash);
  }
}

main();