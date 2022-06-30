import { NETWORK_CCY, WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { serializeToken } from 'state/user/hooks/helpers'
import { serializeTokens } from './tokens'
import { PoolClass, SerializedFarmConfig } from './types'



const farms = (chainId: number): SerializedFarmConfig[] => {
  const serializedTokens = serializeTokens(chainId)
  const serializedNetworkCcy = serializeToken(WRAPPED_NETWORK_TOKENS[chainId ?? 43113])
  return [
    /**
     * These 3 farms (PID 0, 251, 252) should always be at the top of the file.
     */
    // {
    //   pid: 0,
    //   lpSymbol: 'REQT',
    //   lpAddresses: {
    //     97: '',
    //     56: '',
    //     43113: '0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c'
    //   },
    //   token: serializedTokens.reqt,
    //   quoteToken: serializedTokens.dai,
    // },
    {
      pid: 0,
      poolAddress: '0x086AbCBD5377fFCD5441f0da1969eb468903b693',
      lpSymbol: 'REQA-DAI LP',
      lpAddresses: {
        97: '',
        56: '',
        43113: '0x086AbCBD5377fFCD5441f0da1969eb468903b693'
      },
      // token: serializedTokens.reqt,
      // quoteToken: serializedTokens.dai,
      tokens: [serializedTokens.reqt, serializedTokens.dai],
      weights: [70, 30],
      quoteTokenIndex: 1,
      poolClass: PoolClass.PAIR,
      lpData: {
        weight: 70, // weightToken
        fee: 25,
        pricerKey: ['0x64796164fe724798d07CaFe6D19c05b5276A3903-0xaEA51E4FEe50a980928B4353E852797b54deacd8']
      },
      lockMaturity: 0

    },
    {
      pid: 1,
      poolAddress: '0x2d5d1137d5e57975a3d7e265c6d8ebbadcd506ec',
      lpSymbol: 'REQ-3-CLASSIC DEP',
      lpAddresses: {
        97: '',
        56: '',
        43113: '0xA9767BA217AC2543799409E5B4970B7cb3dF3Ed5'
      },
      // token: serializedTokens.wbtc,
      // quoteToken: serializedTokens.usdt,
      // token2: serializedTokens.usdt,
      tokens: [
        serializedTokens.usdt,
        serializedTokens.wbtc,
        serializedTokens.weth
      ],
      weights: [1 / 3, 1 / 3, 1 / 3],
      quoteTokenIndex: 0,
      poolClass: PoolClass.WEIGHTED,
      lpData: {
        pricerKey: [
          '0x31AbD3aA54cb7bdda3f52e304A5Ed9c1a783D289-0xaEA51E4FEe50a980928B4353E852797b54deacd8'
        ]
      },
      lockMaturity: 0
    },

    {
      pid: 2,
      poolAddress: '0x344aF4Fd88199F5167332ffe2438ABeC13d6061B',
      lpSymbol: '(w)AVAX-USDC LP',
      lpAddresses: {
        97: '',
        56: '',
        43113: '0x344aF4Fd88199F5167332ffe2438ABeC13d6061B'
      },
      // token: serializedTokens.reqt,
      // quoteToken: serializedTokens.dai,
      tokens: [serializedTokens.wavax,
      serializedTokens.usdc],
      weights: [50, 50],
      quoteTokenIndex: 1,
      poolClass: PoolClass.PAIR,
      lpData: {
        weight: 80, // weightToken
        fee: 25,
        pricerKey: ['0xCa9eC7085Ed564154a9233e1e7D8fEF460438EEA-0xd00ae08403B9bbb9124bB305C09058E32C39A48c']
      },
      lockMaturity: 0

    },
    // {
    //   pid: 2,
    //   lpSymbol: `(w)${NETWORK_CCY[chainId ?? 43113].symbol}-USDC LP`,
    //   lpAddresses: {
    //     97: '',
    //     56: '',
    //     43113: '0x1152803C660f86D262f9A235612ddc82f705c0bD'
    //   },
    //   token: serializedTokens.wavax,
    //   quoteToken: serializedTokens.usdc,
    //   lpData: {
    //     weight: 50,
    //     fee: 10,
    //     poolType: PoolType.AmplifiedWeightedPair,
    //     pricerKey: ['0xCa9eC7085Ed564154a9233e1e7D8fEF460438EEA-0xd00ae08403B9bbb9124bB305C09058E32C39A48c']
    //   }
    // },
    // {
    //   pid: 3,
    //   lpSymbol: `USD-Quad-Pool`,
    //   lpAddresses: {
    //     97: '',
    //     56: '',
    //     43113: '0x3372DE341A07418765Ae12f77aEe9029EaA4442A'
    //   },
    //   token: serializedTokens.usdt,
    //   quoteToken: serializedTokens.usdc,
    //   token2: serializedTokens.dai,
    //   token3: serializedTokens.tusd,
    //   lpData: {
    //     poolType: PoolType.StablePairWrapper
    //   }
    // },
    // {
    //   pid: 4,
    //   lpSymbol: 'wBTC-wETH LP',
    //   lpAddresses: {
    //     97: '',
    //     56: '',
    //     43113: '0x8CDD0529B4Afe692798aFEb83974bB9F34934CEf'
    //   },
    //   token: serializedTokens.weth,
    //   quoteToken: serializedTokens.wbtc,
    //   lpData: {
    //     weight: 50, // weightToken
    //     fee: 15,
    //     poolType: PoolType.AmplifiedWeightedPair,
    //     pricerKey: [
    //       '0x31AbD3aA54cb7bdda3f52e304A5Ed9c1a783D289-0x70dC2c5F81BC18e115759398aF197e99f228f713',
    //       '0x70dC2c5F81BC18e115759398aF197e99f228f713-0xCa9eC7085Ed564154a9233e1e7D8fEF460438EEA'
    //     ]
    //   }
    // }
  ]
}

export default farms