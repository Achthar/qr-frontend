import { JSBI, Percent, Token, WETH, ChainId, WRAPPED_NETWORK_TOKENS, NETWORK_CCY, Currency } from '@requiemswap/sdk'
import ms from 'ms.macro'

import { BUSD, DAI, USDT, BTCB, CAKE, WBNB, UST, ETH, USDC, REQT } from './tokens'

export const LANDING_PAGE = 'https://requiem.finance/'

export const AVALANCHE_CHAIN_PARAMS = {
  chainId: '0xa86a', // A 0x-prefixed hexadecimal chainId
  chainName: 'Avalanche Mainnet C-Chain',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18
  },
  rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://cchain.explorer.avax.network/']
}

export const ROUTER_ADDRESS: { [chainId in ChainId] } = {
  [ChainId.BSC_MAINNET]: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  [ChainId.BSC_TESTNET]: '0x149dA9015BdaccdCb06209B7EbE095c0303333c4',
  [ChainId.ARBITRUM_MAINNET]: '',
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: '',
  [ChainId.AVAX_MAINNET]: '',
  [ChainId.AVAX_TESTNET]: '0x2a90276992ddC21C3585FE50f5B43D0Cf62aDe03',
  [ChainId.MATIC_MAINNET]: '',
  [ChainId.MATIC_TESTNET]: '0x4e8848da06E40E866b82f6b52417494936c9509b'
}

export const AGGREGATOR_ADDRESS = {
  43113: '0x5726fa73f24Fac131c44282e17917A6a13C8307e'
}

export const REQUIEMQROUTER_ADDRESS = {
  43113: '0x96835701766b9c05FeF8C3F66c66337feBA08b42'
}

export const L1_CHAIN_IDS = [
  ChainId.BSC_MAINNET,
  ChainId.BSC_TESTNET,
  ChainId.AVAX_MAINNET,
  ChainId.AVAX_TESTNET
] as const

export type SupportedL1ChainId = typeof L1_CHAIN_IDS[number]

export const L2_CHAIN_IDS = [
  ChainId.ARBITRUM_MAINNET,
  ChainId.ARBITRUM_TETSNET_RINKEBY,
  ChainId.MATIC_MAINNET,
  ChainId.MATIC_TESTNET,
] as const

export type SupportedL2ChainId = typeof L2_CHAIN_IDS[number]

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

export interface L1ChainInfo {
  readonly blockWaitMsBeforeWarning?: number
  readonly docs: string
  readonly explorer: string
  readonly infoLink: string
  readonly label: string
  readonly logoUrl?: string
  readonly rpcUrls?: string[]
  readonly nativeCurrency: {
    name: string // 'Goerli ETH',
    symbol: string // 'gorETH',
    decimals: number // 18,
  }
}
export interface L2ChainInfo extends L1ChainInfo {
  readonly bridge: string
  readonly logoUrl: string
  readonly statusPage?: string
}

export type ChainInfo = { readonly [chainId: number]: L1ChainInfo | L2ChainInfo } & {
  readonly [chainId in SupportedL2ChainId]: L2ChainInfo
} &
  { readonly [chainId in SupportedL1ChainId]: L1ChainInfo }

export const CHAIN_INFO: ChainInfo = {
  [ChainId.ARBITRUM_MAINNET]: {
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://arbiscan.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum',
    label: 'Arbitrum',
    logoUrl: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/tokens/REQT.png',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
  },
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: {
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://rinkeby-explorer.arbitrum.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum/',
    label: 'Arbitrum Rinkeby',
    logoUrl: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/tokens/REQT.png',
    nativeCurrency: { name: 'Rinkeby ArbETH', symbol: 'rinkArbETH', decimals: 18 },
    rpcUrls: ['https://rinkeby.arbitrum.io/rpc'],
  },
  [ChainId.BSC_MAINNET]: {
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://docs.binance.org/',
    explorer: 'https://bscscan.com/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Binance',
    logoUrl: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/networks/BNB.svg',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed1.ninicoin.io', 'https://bsc-dataseed1.defibit.io',
      'https://bsc-dataseed.binance.org', 'https://bsc-dataseed2.binance.org/',
      'https://bsc-dataseed3.binance.org/', 'https://bsc-dataseed4.binance.org/'],
  },
  [ChainId.BSC_TESTNET]: {
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://docs.binance.org/',
    explorer: 'https://testnet.bscscan.com/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Binance Testnet',
    logoUrl: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/networks/BNB.svg',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/', 'https://data-seed-prebsc-2-s1.binance.org:8545/',
      'https://data-seed-prebsc-1-s2.binance.org:8545/'],
  },
  [ChainId.AVAX_MAINNET]: {
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://explorer.avax.network/',
    infoLink: 'https://www.avax.network/',
    label: 'Avalanche',
    logoUrl: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/networks/AVAX.svg',
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  },
  [ChainId.AVAX_TESTNET]: {
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://cchain.explorer.avax-test.network/',
    infoLink: 'https://www.avax.network/',
    label: 'Avalanche Testnet',
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
    logoUrl: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/networks/AVAX.svg',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  },
  [ChainId.MATIC_MAINNET]: {
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: 'https://wallet.polygon.technology/',
    docs: 'https://optimism.io/',
    explorer: 'https://polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/optimism',
    label: 'Polygon',
    logoUrl: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/networks/MATIC.svg',
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://rpc-mainnet.maticvigil.com'],
    statusPage: 'https://optimism.io/status',
  },
  [ChainId.MATIC_TESTNET]: {
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: 'https://gateway.optimism.io/',
    docs: 'https://optimism.io/',
    explorer: 'https://mumbai.polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/optimism',
    label: 'Polygon Mumbai',
    rpcUrls: ['https://rpc-mumbai.matic.today'],
    logoUrl: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/networks/MATIC.svg',
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    statusPage: 'https://optimism.io/status',
  },
}

export const ALL_SUPPORTED_CHAIN_IDS = [
  ChainId.BSC_MAINNET, ChainId.BSC_TESTNET,
  ChainId.MATIC_TESTNET,
  ChainId.AVAX_MAINNET, ChainId.AVAX_TESTNET,
  ChainId.ARBITRUM_TETSNET_RINKEBY
]

export const SUPPORTED_IDS_TO_RPC_URL = {
  [ChainId.BSC_MAINNET]: CHAIN_INFO[ChainId.BSC_MAINNET].rpcUrls, [ChainId.BSC_TESTNET]: CHAIN_INFO[ChainId.BSC_TESTNET].rpcUrls,
  [ChainId.MATIC_TESTNET]: CHAIN_INFO[ChainId.MATIC_TESTNET].rpcUrls,
  [ChainId.AVAX_MAINNET]: CHAIN_INFO[ChainId.AVAX_MAINNET].rpcUrls, [ChainId.AVAX_TESTNET]: CHAIN_INFO[ChainId.AVAX_TESTNET].rpcUrls,
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: CHAIN_INFO[ChainId.ARBITRUM_TETSNET_RINKEBY].rpcUrls,
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  [ChainId.BSC_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.BSC_MAINNET], CAKE[ChainId.BSC_MAINNET], BUSD[ChainId.BSC_MAINNET], USDT[ChainId.BSC_MAINNET], BTCB, UST, ETH[ChainId.BSC_MAINNET], USDC[ChainId.BSC_MAINNET]],
  [ChainId.BSC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.BSC_TESTNET], CAKE[ChainId.BSC_TESTNET], BUSD[ChainId.BSC_TESTNET], ETH[ChainId.BSC_TESTNET]],
  [ChainId.ARBITRUM_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.ARBITRUM_MAINNET]],
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: [WRAPPED_NETWORK_TOKENS[ChainId.ARBITRUM_TETSNET_RINKEBY]],
  [ChainId.AVAX_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.AVAX_MAINNET]],
  [ChainId.AVAX_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.AVAX_TESTNET], REQT[ChainId.AVAX_TESTNET], USDT[ChainId.AVAX_TESTNET], DAI[ChainId.AVAX_TESTNET], USDC[ChainId.AVAX_TESTNET]],
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
  [ChainId.AVAX_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.AVAX_MAINNET]],
  [ChainId.AVAX_TESTNET]: [USDT[ChainId.AVAX_TESTNET]],
  [ChainId.MATIC_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_MAINNET], USDC[ChainId.MATIC_MAINNET]],
  [ChainId.MATIC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_TESTNET], USDC[ChainId.MATIC_TESTNET]]
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  [ChainId.BSC_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.BSC_MAINNET], DAI[ChainId.BSC_MAINNET], BUSD[ChainId.BSC_MAINNET], USDT[ChainId.BSC_MAINNET]],
  [ChainId.BSC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.BSC_TESTNET], CAKE[ChainId.BSC_TESTNET], BUSD[ChainId.BSC_TESTNET], DAI[ChainId.BSC_TESTNET]],
  [ChainId.ARBITRUM_MAINNET]: [],
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: [],
  [ChainId.AVAX_MAINNET]: [],
  [ChainId.AVAX_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.AVAX_TESTNET], USDT[ChainId.AVAX_TESTNET]],
  [ChainId.MATIC_MAINNET]: [],
  [ChainId.MATIC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_TESTNET], USDC[ChainId.MATIC_TESTNET]]
}

export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {
  [ChainId.BSC_MAINNET]: [
    [CAKE[ChainId.BSC_MAINNET], WRAPPED_NETWORK_TOKENS[ChainId.BSC_MAINNET]],
    [BUSD[ChainId.BSC_MAINNET], USDT[ChainId.BSC_MAINNET]],
    [DAI[ChainId.BSC_MAINNET], USDT[ChainId.BSC_MAINNET]],
  ],
  [ChainId.BSC_TESTNET]: [
    [CAKE[ChainId.BSC_TESTNET], WRAPPED_NETWORK_TOKENS[ChainId.BSC_TESTNET]],
    [BUSD[ChainId.BSC_TESTNET], DAI[ChainId.BSC_TESTNET]],
  ],
  [ChainId.MATIC_TESTNET]: [
    [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_TESTNET], USDC[ChainId.MATIC_TESTNET]],
    [REQT[ChainId.MATIC_TESTNET], USDC[ChainId.MATIC_TESTNET]],
  ],
  [ChainId.AVAX_TESTNET]: [
    [WRAPPED_NETWORK_TOKENS[ChainId.AVAX_TESTNET], USDT[ChainId.AVAX_TESTNET]],
    [REQT[ChainId.AVAX_TESTNET], USDT[ChainId.AVAX_TESTNET]],
  ],
}

// tokenA, tokenB, weightA, fee
export const PINNED_WEIGHTED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token, number, number][] } = {
  [ChainId.AVAX_TESTNET]: [
    [WRAPPED_NETWORK_TOKENS[ChainId.AVAX_TESTNET], REQT[ChainId.AVAX_TESTNET], 20, 25],
    [WRAPPED_NETWORK_TOKENS[ChainId.AVAX_TESTNET], USDC[ChainId.AVAX_TESTNET], 50, 10]
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

// transaction popup dismisal amounts
export const DEFAULT_TXN_DISMISS_MS = 25000

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

// data for weighted pools
export const STANDARD_FEES =  [5, 10, 15, 20, 25, 30, 35]
export const STANDARD_WEIGHTS =  [10, 20, 30, 40, 50, 60, 70, 80]