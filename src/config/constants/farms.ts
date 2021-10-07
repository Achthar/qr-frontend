import tokens from './tokens'
import { FarmConfig, ChainGroup } from './types'

export const farms: FarmConfig[] = [
  /**
   * These 3 farms (PID 0, 251, 252) should always be at the top of the file.
   */
  {
    pid: 0,
    lpSymbol: 'CAKE',
    lpAddresses: {
      97: '0x9C21123D94b93361a29B2C2EFB3d5CD8B17e0A9e',
      56: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
    },
    token: tokens.syrup,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 251,
    lpSymbol: 'CAKE-BNB LP',
    lpAddresses: {
      97: '0x3ed8936cAFDF85cfDBa29Fbe5940A5b0524824F4',
      56: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',
    },
    token: tokens.cake,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 252,
    lpSymbol: 'BUSD-BNB LP',
    lpAddresses: {
      97: '',
      56: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
    },
    token: tokens.busd,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 11,
    lpSymbol: 'USDT-BUSD LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0xc15fa3E22c912A276550F3E5FE3b0Deb87B55aCd',
    },
    token: tokens.usdt,
    quoteToken: tokens.busd,
  },
  {
    pid: 14,
    lpSymbol: 'ETH-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x70D8929d04b60Af4fb9B58713eBcf18765aDE422',
    },
    token: tokens.eth,
    quoteToken: tokens.wbnb,
  },
  {
    pid: 15,
    lpSymbol: 'BTCB-BNB LP',
    lpAddresses: {
      97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
      56: '0x7561EEe90e24F3b348E1087A005F78B4c8453524',
    },
    token: tokens.btcb,
    quoteToken: tokens.wbnb,
  },
]


export const farmList: { [chain in ChainGroup]: FarmConfig[] } = {
  /**
   * These 3 farms (PID 0, 251, 252) should always be at the top of the file.
   */
  [ChainGroup.BSC]:
    [
      {
        pid: 0,
        lpSymbol: 'CAKE',
        lpAddresses: {
          97: '0x9C21123D94b93361a29B2C2EFB3d5CD8B17e0A9e',
          56: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
        },
        token: tokens.syrup,
        quoteToken: tokens.wbnb,
      },
      {
        pid: 251,
        lpSymbol: 'CAKE-BNB LP',
        lpAddresses: {
          97: '0x3ed8936cAFDF85cfDBa29Fbe5940A5b0524824F4',
          56: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',
        },
        token: tokens.cake,
        quoteToken: tokens.wbnb,
      },
      {
        pid: 252,
        lpSymbol: 'BUSD-BNB LP',
        lpAddresses: {
          97: '',
          56: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
        },
        token: tokens.busd,
        quoteToken: tokens.wbnb,
      },
      {
        pid: 11,
        lpSymbol: 'USDT-BUSD LP',
        lpAddresses: {
          97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
          56: '0xc15fa3E22c912A276550F3E5FE3b0Deb87B55aCd',
        },
        token: tokens.usdt,
        quoteToken: tokens.busd,
      },
      {
        pid: 14,
        lpSymbol: 'ETH-BNB LP',
        lpAddresses: {
          97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
          56: '0x70D8929d04b60Af4fb9B58713eBcf18765aDE422',
        },
        token: tokens.eth,
        quoteToken: tokens.wbnb,
      },
      {

        pid: 15,
        lpSymbol: 'BTCB-BNB LP',
        lpAddresses: {
          97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
          56: '0x7561EEe90e24F3b348E1087A005F78B4c8453524',
        },
        token: tokens.btcb,
        quoteToken: tokens.wbnb,
      }],
  [ChainGroup.MATIC]: [
    {
      pid: 0,
      lpSymbol: 'REQT',
      lpAddresses: {
        97: '0x9C21123D94b93361a29B2C2EFB3d5CD8B17e0A9e',
        56: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
      },
      token: tokens.syrup,
      quoteToken: tokens.wmatic,
    },
    {
      pid: 251,
      lpSymbol: 'REQT-USDC LP',
      lpAddresses: {
        80001: '0x3ed8936cAFDF85cfDBa29Fbe5940A5b0524824F4',
      },
      token: tokens.cake,
      quoteToken: tokens.wmatic,
    },
    {
      pid: 252,
      lpSymbol: 'USDC-WMATIC LP',
      lpAddresses: {
        80001: '0xc443a026e9008114fc93c8e7bff5d8ef2c01f36a',
      },
      token: tokens.busd,
      quoteToken: tokens.wmatic,
    },
    {
      pid: 16,
      lpSymbol: 'USDC-DAI LP',
      lpAddresses: {
        80001: '0x8aaff7c48c0cc77b27aeab7cd74ae10b638e8972',
      },
      token: tokens.busd,
      quoteToken: tokens.wmatic,
    },
    {
      pid: 11,
      lpSymbol: 'USDT-BUSD LP',
      lpAddresses: {
        97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
        56: '0xc15fa3E22c912A276550F3E5FE3b0Deb87B55aCd',
      },
      token: tokens.usdt,
      quoteToken: tokens.wmatic,
    },
    {
      pid: 14,
      lpSymbol: 'ETH-BNB LP',
      lpAddresses: {
        97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
        56: '0x70D8929d04b60Af4fb9B58713eBcf18765aDE422',
      },
      token: tokens.eth,
      quoteToken: tokens.wmatic,
    },
    {
      pid: 15,
      lpSymbol: 'BTCB-BNB LP',
      lpAddresses: {
        97: '0xE66790075ad839978fEBa15D4d8bB2b415556a1D',
        56: '0x7561EEe90e24F3b348E1087A005F78B4c8453524',
      },
      token: tokens.btcb,
      quoteToken: tokens.wmatic,
    }],
  [ChainGroup.AVAX]: [
    {
      pid: 0,
      lpSymbol: 'REQT',
      lpAddresses: {
        43113: '0x78e418385153177cB1c49e58eAB5997192998bf7',
      },
      token: tokens.syrup,
      quoteToken: tokens.wavax,
    },
    {
      pid: 251,
      lpSymbol: 'REQT-USDT LP',
      lpAddresses: {
        43113: '',
      },
      token: tokens.cake,
      quoteToken: tokens.wavax,
    },
    {
      pid: 252,
      lpSymbol: 'WAVAX-USDT LP',
      lpAddresses: {
        43113: '0x310962879d5B341Dd1C98096AD13a3C48f2A27d0',
      },
      token: tokens.usdt,
      quoteToken: tokens.wmatic,
    },
    {
      pid: 16,
      lpSymbol: 'USDT-DAI LP',
      lpAddresses: {
        43113: '0x23303b1b69d5f62fde2ccee26835fd646850b2c8',
      },
      token: tokens.usdt,
      quoteToken: tokens.dai,
    },
  ],
  [ChainGroup.ETH]: []
}
