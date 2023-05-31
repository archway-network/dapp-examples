import { SigningArchwayClient } from '@archwayhq/arch3.js';
import BigNumber from 'bignumber.js';
import ChainInfo from './constantine.config.js';

window.onload = async () => {
    if (!window.getOfflineSigner || !window.keplr) {
        alert("Please install keplr extension");
    } else {
        if (window.keplr.experimentalSuggestChain) {
            try {
                await window.keplr.experimentalSuggestChain(ChainInfo);

                window.keplr.defaultOptions = {
                    sign: {
                        preferNoSetFee: true,
                    }
                }
            } catch {
                alert("Failed to suggest the chain");
            }
        } else {
            alert("Please use the recent version of keplr extension");
        }
    }
};

document.sendForm.onsubmit = () => {
    (async () => {
        const chainId = ChainInfo.chainId;

        await window.keplr.enable(chainId);

        const offlineSigner = window.keplr.getOfflineSigner(chainId);
        const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);

        const accounts = await offlineSigner.getAccounts();
        const destinationAddress = document.sendForm.recipient.value;

        let amount = new BigNumber(document.sendForm.amount.value);
        amount = amount.multipliedBy(new BigNumber('1e18'));

        const amountFinal = {
            denom: 'aconst',
            amount: amount.toString(),
        }

        const memo = "Transfer token to another account";

        const broadcastResult = await signingClient.sendTokens(
            accounts[0].address,
            destinationAddress,
            [amountFinal],
            "auto",
            memo,
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
