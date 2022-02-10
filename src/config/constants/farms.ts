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
      lpData:{
        weight:80,
        fee:25,
        poolType: PoolType.WeightedPair
      }
    },
    {
      pid: 1,
      lpSymbol: 'WBTC-WETH LP',
      lpAddresses: {
        97: '',
        56: '',
        43113: '0x77bd5141C1c868aa601fE68f062fBEe84Ff34bde'
      },
      token: serializedTokens.weth,
      quoteToken: serializedTokens.wbtc,
    },
    {
      pid: 2,
      lpSymbol: `${NETWORK_CCY[chainId ?? 43113].symbol}-USDC LP`,
      lpAddresses: {
        97: '',
        56: '',
        43113: '0x1152803c660f86d262f9a235612ddc82f705c0bd'
      },
      token: serializedTokens.wavax,
      quoteToken: serializedTokens.usdc,
      lpData:{
        weight:50,
        fee:15,
        poolType: PoolType.WeightedPair
      }
    },
    {
      pid: 3,
      lpSymbol: `req4-Pool`,
      lpAddresses: {
        97: '',
        56: '',
        43113: '0x3372DE341A07418765Ae12f77aEe9029EaA4442A'
      },
      token: serializedTokens.usdt,
      quoteToken: serializedTokens.usdc,
      token2: serializedTokens.dai,
      token3: serializedTokens.tusd,
      lpData:{
        poolType: PoolType.StablePairWrapper
      }
    },
  ]
}

export default farms