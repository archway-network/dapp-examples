import { SigningArchwayClient } from '@archwayhq/arch3.js';
import ChainInfo from './constantine.config.js';
import { GasPrice } from "@cosmjs/stargate";

window.onload = async () => {
    if (!window.getOfflineSigner || !window.keplr) {
        alert("Please install keplr extension");
    } else {
        if (window.keplr.experimentalSuggestChain) {
            try {
                await window.keplr.experimentalSuggestChain(ChainInfo);
            } catch {
                alert("Failed to suggest the chain");
            }
        } else {
            alert("Please use the recent version of keplr extension");
        }
    }

    /**await window.keplr.enable(ChainInfo.chainId);

    const offlineSigner = window.keplr.getOfflineSigner(ChainInfo.chainId);

    const accounts = await offlineSigner.getAccounts();

    const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner, {
        gasPrice: GasPrice.fromString('0.02uconst'),
    });**/
};

document.sendForm.onsubmit = () => {
    const recipient = document.sendForm.recipient.value;

    let amount = document.sendForm.amount.value;
    amount = parseFloat(amount);
    if (isNaN(amount)) {
        alert("Invalid amount");
        return false;
    }

    amount *= 1000000;
    amount = Math.floor(amount);

    (async () => {
        const chainId = ChainInfo.chainId;

        await window.keplr.enable(chainId);

        const offlineSigner = window.keplr.getOfflineSigner(chainId);

        const accounts = await offlineSigner.getAccounts();

        const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner, {
            gasPrice: GasPrice.fromString('0.02uconst'),
        });

        /**const client = await SigningStargateClient.connectWithSigner(
            ChainInfo.rpc,
            offlineSigner
        );**/

        const amountFinal = {
            denom: 'uconst',
            amount: amount.toString(),
        }

        const fee = {
            amount: [{
                denom: 'uconst',
                amount: '5000',
            }, ],
            gas: '200000',
        }

        const memo = "Transfer token to another account";
        const msgSend = {
            fromAddress: accounts[0].address,
            toAddress: recipient,
            amount: [amountFinal],
        };

        const msgAny = {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: msgSend,
        };

        /**const signedTx = await client.signAndBroadcast(accounts[0].address, [msgAny], fee, memo);

        console.log(signedTx);**/

        const broadcastResult = await signingClient.signAndBroadcast(
            accounts[0].address,
            [msgAny],
            fee,
            memo, // optional
        );

        if (broadcastResult.code !== undefined &&
            broadcastResult.code !== 0) {
            alert("Failed to send tx: " + broadcastResult.log || broadcastResult.rawLog);
        } else {
            alert("Succeed to send tx:" + broadcastResult.transactionHash);
        }
    })();

    return false;
};
