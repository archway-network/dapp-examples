const currency = {
    coinDenom: 'CONST',
    coinMinimalDenom: 'uconst',
    coinDecimals: 18,
    coinGeckoId: 'constantine-network',
  };
  
  const ChainInfo = {
    chainId: 'constantine-3',
    chainName: 'Constantine',
    rpc: 'https://rpc.constantine.archway.io',
    rest: 'https://api.constantine.archway.io',
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