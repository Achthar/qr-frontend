import { NETWORK_CCY, PoolType, WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { serializeToken } from 'state/user/hooks/helpers'
import { serializeTokens } from './tokens'
import { SerializedFarmConfig } from './types'



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
      lpSymbol: 'REQT-DAI LP',
      lpAddresses: {
        97: '',
        56: '',
        43113: '0xCDe9F3Be9786E91b3B309bcF5F6de69c9EA8739c'
      },
      token: serializedTokens.reqt,
      quoteToken: serializedTokens.dai,
      lpData: {
        weight: 80, // weightToken
        fee: 25,
        poolType: PoolType.WeightedPair,
        pricerKey: ['0x2d90e6d9368b2838a9558B0a609750243C5C4679-0xaEA51E4FEe50a980928B4353E852797b54deacd8']
      }
    },
    {
      pid: 1,
      lpSymbol: 'wBTC-DAI LP',
      lpAddresses: {
        97: '',
        56: '',
        43113: '0x77bd5141C1c868aa601fE68f062fBEe84Ff34bde'
      },
      token: serializedTokens.wbtc,
      quoteToken: serializedTokens.dai,
      lpData: {
        weight: 30, // weightToken
        fee: 10,
        poolType: PoolType.WeightedPair,
        pricerKey: [
          '0x31AbD3aA54cb7bdda3f52e304A5Ed9c1a783D289-0xaEA51E4FEe50a980928B4353E852797b54deacd8'
        ]
      }
    },
    {
      pid: 2,
      lpSymbol: `(w)${NETWORK_CCY[chainId ?? 43113].symbol}-USDC LP`,
      lpAddresses: {
        97: '',
        56: '',
        43113: '0x1152803C660f86D262f9A235612ddc82f705c0bD'
      },
      token: serializedTokens.wavax,
      quoteToken: serializedTokens.usdc,
      lpData: {
        weight: 50,
        fee: 10,
        poolType: PoolType.WeightedPair,
        pricerKey: ['0xCa9eC7085Ed564154a9233e1e7D8fEF460438EEA-0xd00ae08403B9bbb9124bB305C09058E32C39A48c']
      }
    },
    {
      pid: 3,
      lpSymbol: `USD-Quad-Pool`,
      lpAddresses: {
        97: '',
        56: '',
        43113: '0x3372DE341A07418765Ae12f77aEe9029EaA4442A'
      },
      token: serializedTokens.usdt,
      quoteToken: serializedTokens.usdc,
      token2: serializedTokens.dai,
      token3: serializedTokens.tusd,
      lpData: {
        poolType: PoolType.StablePairWrapper
      }
    },
    {
      pid: 4,
      lpSymbol: 'wBTC-wETH LP',
      lpAddresses: {
        97: '',
        56: '',
        43113: '0x8CDD0529B4Afe692798aFEb83974bB9F34934CEf'
      },
      token: serializedTokens.weth,
      quoteToken: serializedTokens.wbtc,
      lpData: {
        weight: 50, // weightToken
        fee: 15,
        poolType: PoolType.WeightedPair,
        pricerKey: [
          '0x31AbD3aA54cb7bdda3f52e304A5Ed9c1a783D289-0x70dC2c5F81BC18e115759398aF197e99f228f713',
          '0x70dC2c5F81BC18e115759398aF197e99f228f713-0xCa9eC7085Ed564154a9233e1e7D8fEF460438EEA'
        ]
      }
    }
  ]
}

export default farms