<script lang="ts" setup>
import { WebsocketClient } from '@cosmjs/tendermint-rpc';
import { ref, onUnmounted } from 'vue';

const address = 'archway1szn4zwmmu73ktn04qswh0xgvjnnsrwmkqm8daa';
const channel = `23`;
const externalDenom = 'uconst';

const subscription = ref();

const queryForBalanceUpdate = async () => {
  try {
    const websocket = new WebsocketClient('wss://rpc.constantine-2.archway.tech/websocket', error => console.error(error));
    const stream = websocket.listen({
      jsonrpc: '2.0',
      method: 'subscribe',
      id: '0',
      params: {
        query: `tm.event = 'Tx' AND transfer.recipient CONTAINS '${address}' AND write_acknowledgement.packet_dst_channel = '${channel}' AND fungible_token_packet.denom = '${externalDenom}'`,
      },
    });
    subscription.value = stream.subscribe({
      next: _res => {
        console.log('Matching transaction found');
      },
      error: err => {
        throw err;
      },
      complete: () => {
        websocket.disconnect();
      },
    });
  } catch (err) {
    console.error(err);
    disconnectFromWebsocket();
  }
};

const disconnectFromWebsocket = () => {
  subscription.value?.unsubscribe();
};

onUnmounted(() => {
  disconnectFromWebsocket();
});
</script>