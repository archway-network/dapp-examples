import { SigningArchwayClient, ArchwayClient } from '@archwayhq/arch3.js';
import ChainInfo from './constantine.config.js';
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx.js';
import { toUtf8 } from '@cosmjs/encoding';

// Set the increment smart contract address
const smartContractAddress = "archway1ce97k929shkfzp633edt34hhv3uaqlkgsu3j4xqwjlg2fmg8y5hsw4lewj";

// Set the fee granter address who created the allowance for the signerAddress
const feeGranterAddress = "archway12qj4v8jg5pxk6gsqct09sf9szhwql69xmf9fh4";

let accounts, signerAddress, offlineSigner;

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

                // Set the chain ID
                const chainId = ChainInfo.chainId;

                // Enable the constantine testnet. If it's not yet enabled the user will see an approval screen to enable the chain.
                await window.keplr.enable(chainId);
                
                // Get offline signer via Keplr
                offlineSigner = window.keplr.getOfflineSigner(chainId);

                // Get user selected account
                accounts = await offlineSigner.getAccounts();
                signerAddress = accounts[0].address;

                // Update values in web page
                fetchData();
                getCount();
            } catch {
                alert("Failed to suggest the chain");
            }
        } else {
            alert("Please use the recent version of keplr extension");
        }
    }
};

window.addEventListener("keplr_keystorechange", async () => {
     // Update account data
     accounts = await offlineSigner.getAccounts();
     signerAddress = accounts[0].address;

     fetchData();
    getCount();
});

const fetchData = async () => {
    try {
        const response = await fetch('https://api.constantine.archway.tech/cosmos/feegrant/v1beta1/allowance/' + feeGranterAddress + '/' + signerAddress);

        const data = await response.json();

        document.getElementById('grantAllowance').textContent = JSON.stringify(data, null, 2);

        console.log(data);
        return data;

    } catch (error) {
        console.error("There was a problem with the fetch operation.", error);
    }
}

const getCount = async () => {
    const client = await ArchwayClient.connect(ChainInfo.rpc);

    const msg = {
        get_count: {},
    };

    const { count } = await client.queryContractSmart(
        smartContractAddress,
        msg
    );

    console.log("count: ", count);

    document.getElementById('contractCounter').textContent = "Counter: " + count;
};

document.incrementForm.onsubmit = () => {
    (async () => {
        // Create arch3.js signing client
        const signingClient = await SigningArchwayClient.connectWithSigner(ChainInfo.rpc, offlineSigner);

        // Increment contract message to increase counter
        const contractMsg = {
            increment: {},
        };

        // Message to execute a transaction via the smart contract
        const executeMsg = {
            typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
            value: MsgExecuteContract.fromPartial({
              sender: signerAddress,
              contract: smartContractAddress,
              msg: toUtf8(JSON.stringify(contractMsg)),
              funds: [],
            }),
        };

        const messages = [executeMsg];
      
        // Set the fee dynamically but the feeGranterAddress will pay the transaction fee if an allowance exist
        const fee = await signingClient.calculateFee(signerAddress, messages, undefined, 1.5, feeGranterAddress);
      
        // Allow the user to sign the transaction via Keplr after which the transaction will be broadcasted on chain
        const broadcastResult = await signingClient.signAndBroadcast(signerAddress, messages, fee);

        if (broadcastResult.code !== undefined &&
            broadcastResult.code !== 0) {
            alert("Increment transacation failed: " + broadcastResult.log || broadcastResult.rawLog);
        } else {
            alert("Increment transacation successful:" + broadcastResult.transactionHash);
            // Update values in web page
            fetchData();
            getCount();
        }
    })();

    return false;
};
