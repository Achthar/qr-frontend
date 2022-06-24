
import { ChainId } from '@requiemswap/sdk'
import BigNumber from 'bignumber.js/bignumber'
// import { BIG_TEN } from 'utils/bigNumber'
import { ChainGroup } from 'config/constants/types'
import { ethers } from 'ethers'

BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
})

export const BSC_BLOCK_TIME = 3

export const blockTimes = (chainId: number) => {
  if (chainId === 57 || chainId === 97) {
    return 3
  }
  if (chainId === 43113 || chainId === 43113) {
    return 14
  }

  return 10
}

export function secondsUntilBlock(chainId: number, startBlock: number, endBlock: number): number {
  const blocksAway = endBlock - startBlock;
  const secondsAway = blocksAway * blockTimes(chainId);

  return secondsAway;
}

export function prettyVestingPeriod(chainId: number, currentBlock: number, vestingBlock: number) {
  if (vestingBlock === 0) {
    return "";
  }

  const seconds = secondsUntilBlock(chainId, currentBlock, vestingBlock);
  if (seconds < 0) {
    return "Fully Vested";
  }
  return prettifySeconds(seconds);
}

export function prettifySeconds(seconds: number, resolution?: string) {
  if (seconds !== 0 && !seconds) {
    return "";
  }

  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (resolution === "day") {
    if (d > 0) {
      return d + (d === 1 ? " day" : " days");
    }

    if (h > 0) {
      return h + (h === 1 ? " hr" : " hrs");
    }

    return m + (m === 1 ? " min" : " mins")

  }

  const dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
  const hDisplay = h > 0 ? h + (h === 1 ? " hr, " : " hrs, ") : "";
  const mDisplay = m > 0 ? m + (m === 1 ? " min" : " mins") : "";

  let result = dDisplay + hDisplay + mDisplay;
  if (mDisplay === "") {
    result = result.slice(0, result.length - 2);
  }

  return result;
}

export const blocksToDays = (blocks: number, chainId: number) => {
  return blockTimes(chainId) * blocks / 3600 / 24
}

export { ChainId } from '@requiemswap/sdk'

export const BASE_BSC_SCAN_URLS = {
  [ChainId.BSC_MAINNET]: 'https://bscscan.com',
  [ChainId.BSC_TESTNET]: 'https://testnet.bscscan.com',
  [ChainId.ARBITRUM_MAINNET]: '',
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: '',
  [ChainId.AVAX_MAINNET]: '',
  [ChainId.AVAX_TESTNET]: '',
  [ChainId.ARBITRUM_MAINNET]: [],
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: [],
  [ChainId.MATIC_MAINNET]: 'https://polygonscan.com/',
  [ChainId.MATIC_TESTNET]: 'https://mumbai.polygonscan.com/',
}

export const BASE_EXPLORER_URLS = {
  [ChainId.BSC_MAINNET]: 'https://bscscan.com',
  [ChainId.BSC_TESTNET]: 'https://testnet.bscscan.com',
  [ChainId.ARBITRUM_MAINNET]: '',
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: '',
  [ChainId.MATIC_MAINNET]: 'https://polygonscan.com/',
  [ChainId.MATIC_TESTNET]: 'https://mumbai.polygonscan.com/',
  [ChainId.AVAX_MAINNET]: [],
  [ChainId.AVAX_TESTNET]: 'https://testnet.snowtrace.io/',
  [ChainId.OASIS_MAINNET]: '',
  [ChainId.OASIS_TESTNET]: 'https://explorer.testnet.oasis.updev.si/'
}

// CAKE_PER_BLOCK details
// 40 CAKE is minted per block
// 20 CAKE per block is sent to Burn pool (A farm just for burning cake)
// 10 CAKE per block goes to CAKE syrup pool
// 9 CAKE per block goes to Yield farms and lottery
// CAKE_PER_BLOCK in config/index.ts = 40 as we only change the amount sent to the burn pool which is effectively a farm.
// CAKE/Block in src/views/Home/components/CakeDataRow.tsx = 15 (40 - Amount sent to burn pool)
export const REWARD_PER_SECOND = new BigNumber(0.006341958400000000)
export const BLOCKS_PER_YEAR = new BigNumber((60 / BSC_BLOCK_TIME) * 60 * 24 * 365) // 10512000
export const REWARD_PER_YEAR = REWARD_PER_SECOND.times(60 * 60 * 24 * 365)
export const BASE_URL = 'https://requiem.finance'
export const BASE_ADD_LIQUIDITY_URL = `${BASE_URL}/add`
export const BASE_LIQUIDITY_POOL_URL = `${BASE_URL}/pool`
export const BASE_BSC_SCAN_URL = BASE_BSC_SCAN_URLS[ChainId.BSC_MAINNET]
export const DEFAULT_TOKEN_DECIMAL = (new BigNumber(10)).pow(18)
export const DEFAULT_GAS_LIMIT = 200000
export const AUCTION_BIDDERS_TO_FETCH = 500
export const RECLAIM_AUCTIONS_TO_FETCH = 500
export const AUCTION_WHITELISTED_BIDDERS_TO_FETCH = 500

export function chainIdToChainGroup(chainId: number): ChainGroup {
  if (chainId === 56 || chainId === 97) { return ChainGroup.BSC }
  if (chainId === 137 || chainId === 80001) { return ChainGroup.MATIC }
  if (chainId === 43113 || chainId === 43114) { return ChainGroup.AVAX }
  return ChainGroup.ETH
}