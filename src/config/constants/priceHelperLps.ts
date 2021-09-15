import tokens from './tokens'
import { FarmConfig, FarmConfigNew } from './types'
import { ChainId } from '../index'

export const priceHelperLps: FarmConfig[] = [
  /**
   * These LPs are just used to help with price calculation for MasterChef LPs (farms.ts).
   * This list is added to the MasterChefLps and passed to fetchFarm. The calls to get contract information about the token/quoteToken in the LP are still made.
   * The absense of a PID means the masterchef contract calls are skipped for this farm.
   * Prices are then fetched for all farms (masterchef + priceHelperLps).
   * Before storing to redux, farms without a PID are filtered out.
   */
  {
    pid: null,
    lpSymbol: 'QSD-BNB LP',
    lpAddresses: {
      97: '',
      56: '0x7b3ae32eE8C532016f3E31C8941D937c59e055B9',
    },
    token: tokens.qsd,
    quoteToken: tokens.wbnb,
  },
]

// export default priceHelperLps

export const priceHelperLpsNew: { [chainId: number]: FarmConfigNew[] } = {
  /**
   * These LPs are just used to help with price calculation for MasterChef LPs (farms.ts).
   * This list is added to the MasterChefLps and passed to fetchFarm. The calls to get contract information about the token/quoteToken in the LP are still made.
   * The absense of a PID means the masterchef contract calls are skipped for this farm.
   * Prices are then fetched for all farms (masterchef + priceHelperLps).
   * Before storing to redux, farms without a PID are filtered out.
   */
  [ChainId.MAINNET_BSC]: [
    {
      pid: null,
      lpSymbol: 'QSD-BNB LP',
      lpAddress: '0x7b3ae32eE8C532016f3E31C8941D937c59e055B9',
      token: tokens.qsd,
      quoteToken: tokens.wbnb,
    },
  ],
  [ChainId.TESTNET_BSC]: [
    {
      pid: null,
      lpSymbol: 'QSD-BNB LP',
      lpAddress: '',
      token: tokens.qsd,
      quoteToken: tokens.wbnb,
    },
  ],
}
