import { serializeTokens } from './tokens'
import { SerializedFarmConfig } from './types'



const farms = (chainId: number): SerializedFarmConfig[] => {
  const serializedTokens = serializeTokens(chainId)
  return [
    /**
     * These 3 farms (PID 0, 251, 252) should always be at the top of the file.
     */
    {
      pid: 0,
      lpSymbol: 'REQT',
      lpAddresses: {
        97: '',
        56: '',
        43113: '0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c'
      },
      token: serializedTokens.reqt,
      quoteToken: serializedTokens.dai,
    },
    {
      pid: 251,
      lpSymbol: 'REQT-DAI LP',
      lpAddresses: {
        97: '',
        56: '',
        43113: '0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c'
      },
      token: serializedTokens.reqt,
      quoteToken: serializedTokens.dai,
    },
    {
      pid: 252,
      lpSymbol: 'WBTC-WETH LP',
      lpAddresses: {
        97: '',
        56: '',
        43113: '0x77bd5141C1c868aa601fE68f062fBEe84Ff34bde'
      },
      token: serializedTokens.weth,
      quoteToken: serializedTokens.wbtc,
    },
  ]
}

export default farms