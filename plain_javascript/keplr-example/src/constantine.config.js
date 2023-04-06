const currency = {
    coinDenom: 'CONST',
    coinMinimalDenom: 'uconst',
    coinDecimals: 6,
    coinGeckoId: 'constantine-network',
  };
  
  const ChainInfo = {
    chainId: 'constantine-2',
    chainName: 'Constantine',
    rpc: 'https://rpc.constantine-2.archway.tech',
    rest: 'https://api.constantine-2.archway.tech',
    stakeCurrency: currency,
    bip44: {
      coinType: 118,
    },
    bech32Config: {
      bech32PrefixAccAddr: 'archway',
      bech32PrefixAccPub: 'archwaypub',
      bech32PrefixValAddr: 'archwayvaloper',
      bech32PrefixValPub: 'archwayvaloperpub',
      bech32PrefixConsAddr: 'archwayvalcons',
      bech32PrefixConsPub: 'archwayvalconspub',
    },
    currencies: [currency],
    feeCurrencies: [currency],
    coinType: 118,
    features: ['cosmwasm', 'ibc-transfer', 'ibc-go'],
    // walletUrlForStaking: '',
  };
  
  export default ChainInfo;