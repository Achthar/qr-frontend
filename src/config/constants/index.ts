import { JSBI, Percent, Token, WETH, ChainId, WRAPPED_NETWORK_TOKENS, NETWORK_CCY } from '@pancakeswap/sdk'
import { BUSD, DAI, USDT, BTCB, CAKE, WBNB, UST, ETH, USDC, REQT } from './tokens'
// import { ChainId } from '../index'


export const ROUTER_ADDRESS: { [chainId in ChainId] } = {
  [ChainId.BSC_MAINNET]: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  [ChainId.BSC_TESTNET]: '0x149dA9015BdaccdCb06209B7EbE095c0303333c4',
  [ChainId.ARBITRUM_MAINNET]: '',
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: '',
  [ChainId.AVAX_MAINNET]: '',
  [ChainId.AVAX_TESTNET]: '',
  [ChainId.MATIC_MAINNET]: '',
  [ChainId.MATIC_TESTNET]: '0x4e8848da06E40E866b82f6b52417494936c9509b'
}


// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

export const ALL_SUPPORTED_CHAIN_IDS = [ChainId.BSC_MAINNET, ChainId.BSC_TESTNET, ChainId.MATIC_TESTNET]

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  [ChainId.BSC_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.BSC_MAINNET], CAKE[ChainId.BSC_MAINNET], BUSD[ChainId.BSC_MAINNET], USDT, BTCB, UST, ETH[ChainId.BSC_MAINNET], USDC[ChainId.BSC_MAINNET]],
  [ChainId.BSC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.BSC_TESTNET], CAKE[ChainId.BSC_TESTNET], BUSD[ChainId.BSC_TESTNET], ETH[ChainId.BSC_TESTNET]],
  [ChainId.ARBITRUM_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.ARBITRUM_MAINNET]],
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: [WRAPPED_NETWORK_TOKENS[ChainId.ARBITRUM_TETSNET_RINKEBY]],
  [ChainId.AVAX_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.AVAX_MAINNET]],
  [ChainId.AVAX_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.AVAX_TESTNET]],
  [ChainId.MATIC_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_MAINNET]],
  [ChainId.MATIC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_TESTNET], REQT[ChainId.MATIC_TESTNET], USDC[ChainId.MATIC_TESTNET], DAI[ChainId.MATIC_TESTNET]]
}

/**
 * Addittional bases for specific tokens
 * @example { [WBTC.address]: [renBTC], [renBTC.address]: [WBTC] }
 */
export const ADDITIONAL_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {
  [ChainId.BSC_MAINNET]: {},
}

/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 * @example [AMPL.address]: [DAI, WETH[ChainId.BSC_MAINNET]]
 */
export const CUSTOM_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {
  [ChainId.BSC_MAINNET]: {},
}

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES: ChainTokenList = {
  [ChainId.BSC_MAINNET]: [BUSD[ChainId.BSC_MAINNET], CAKE[ChainId.BSC_MAINNET], BTCB],
  [ChainId.BSC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.BSC_TESTNET], CAKE[ChainId.BSC_TESTNET], BUSD[ChainId.BSC_TESTNET]],
  [ChainId.ARBITRUM_MAINNET]: [],
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: [],
  [ChainId.AVAX_MAINNET]: [],
  [ChainId.AVAX_TESTNET]: [],
  [ChainId.MATIC_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_MAINNET], USDC[ChainId.MATIC_MAINNET]],
  [ChainId.MATIC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_TESTNET], USDC[ChainId.MATIC_TESTNET]]
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  [ChainId.BSC_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.BSC_MAINNET], DAI[ChainId.BSC_MAINNET], BUSD[ChainId.BSC_MAINNET], USDT],
  [ChainId.BSC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.BSC_TESTNET], CAKE[ChainId.BSC_TESTNET], BUSD[ChainId.BSC_TESTNET], DAI[ChainId.BSC_TESTNET]],
  [ChainId.ARBITRUM_MAINNET]: [],
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: [],
  [ChainId.AVAX_MAINNET]: [],
  [ChainId.AVAX_TESTNET]: [],
  [ChainId.MATIC_MAINNET]: [],
  [ChainId.MATIC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_TESTNET], USDC[ChainId.MATIC_TESTNET]]
}

export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {
  [ChainId.BSC_MAINNET]: [
    [CAKE[ChainId.BSC_MAINNET], WRAPPED_NETWORK_TOKENS[ChainId.BSC_MAINNET]],
    [BUSD[ChainId.BSC_MAINNET], USDT],
    [DAI[ChainId.BSC_MAINNET], USDT],
  ],
  [ChainId.BSC_TESTNET]: [
    [CAKE[ChainId.BSC_TESTNET], WRAPPED_NETWORK_TOKENS[ChainId.BSC_TESTNET]],
    [BUSD[ChainId.BSC_TESTNET], DAI[ChainId.BSC_TESTNET]],
  ],
  [ChainId.MATIC_TESTNET]: [
    [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_TESTNET], USDC[ChainId.MATIC_TESTNET]],
    [REQT[ChainId.MATIC_TESTNET], USDC[ChainId.MATIC_TESTNET]],
  ],
}

export const NetworkContextName = 'NETWORK'

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20

export const BIG_INT_ZERO = JSBI.BigInt(0)

// one basis point
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%

// used to ensure the user doesn't send so much BNB so they end up with <.01
export const MIN_BNB: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 BNB
export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(JSBI.BigInt(50), JSBI.BigInt(10000))

export const ZERO_PERCENT = new Percent('0')
export const ONE_HUNDRED_PERCENT = new Percent('1')

// SDN OFAC addresses
export const BLOCKED_ADDRESSES: string[] = [
  '0x7F367cC41522cE07553e823bf3be79A889DEbe1B',
  '0xd882cFc20F52f2599D84b8e8D58C7FB62cfE344b',
  '0x901bb9583b24D97e995513C6778dc6888AB6870e',
  '0xA7e5d5A720f06526557c513402f2e6B5fA20b008',
  '0x8576aCC5C05D6Ce88f4e49bf65BdF0C62F91353C',
]

export { farmList as farmsConfig } from './farms'
export { default as poolsConfig } from './pools'
export { default as ifosConfig } from './ifo'
