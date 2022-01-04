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
        97: '0x9C21123D94b93361a29B2C2EFB3d5CD8B17e0A9e',
        56: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
        43113: '0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c'
      },
      token: serializedTokens.syrup,
      quoteToken: serializedTokens.wbnb,
    },
    {
      pid: 251,
      lpSymbol: 'REQT-DAI LP',
      lpAddresses: {
        97: '0x3ed8936cAFDF85cfDBa29Fbe5940A5b0524824F4',
        56: '0x0eD7e52944161450477ee417DE9Cd3a859b14fD0',
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
        56: '0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16',
        43113: '0xcde9f3be9786e91b3b309bcf5f6de69c9ea8739c'
      },
      token: serializedTokens.weth,
      quoteToken: serializedTokens.wbtc,
    },
  ]
}

export default farms