import { Percent, Token, ChainId, WRAPPED_NETWORK_TOKENS, NETWORK_CCY, Currency } from '@requiemswap/sdk'
import { BigNumber } from 'ethers'
import ms from 'ms.macro'

import { BUSD, DAI, USDT, BTCB, CAKE, UST, ETH, USDC, REQT, WBTC, WETH, TUSD, ABREQ } from './tokens'

export const LANDING_PAGE = 'https://requiem.finance/'

export interface WeightedPairShell {
  tokenA: Token,
  tokenB: Token,
  weightA: number,
  fee: number,
  address: string
}

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

// pairs
// const addresses  = {
//   admin: '0xF762FBA4DbcAD00c13D4357d6f199923Af8598AB',
//   formula: '0x9a81727D61e4D6C966c181DaCE99F80a0B1eE01e',
//   factory: '0x9a8F3a3f776afc12c33F4E1997E9398E2ce42CC2',
//   router: '0x6e28e6446586Bb2e63AAE51214e8A13e74CE2dEd'
// }

// stable

// addresses {
//   poolCrator: '0x8D980c027358a87F35579958C69b83C441E2fF55',
//   factory: '0x714C8144c8cE87329161a48FCDdf685b3E700470',
//   pool: '0xE6c9c45B6b6cd38Dc2E6CC061eD29d5FC93Ba1C3'
// }

// weighted
// addresses {
//   poolCrator: '0xe92536469bc918e434d53b2638a7eee1cc1af2fd',
//   factory: '0x89E3dc2393f01BfCaE27AC74E639eC708c1E041d'
//   pool: '0xB95e9315d587FEcbD58C33Dd17Bd9762664622BA'
// }

export const STABLE_SWAP_ADDRESS = {
  43113: '0x9912aafb08f9c018bd0317c673951a5f4967831f'
}

export const WEIGHTED_POOL_ADDRESSES = {
  43113: '0xb288d26a17aab729a64d8320836c2ea4794b3baf'
}

export const PAIR_FORMULA = {
  43113: '0x5556288c865d9e9DecC22c9f3F764F00E244fB39',
  42261: '0x7B514a86382f4482C23FdE9c8128f0ca757AfAdE',
  18: '0xb3a65e1bF6884eC96fdA1e8F09e477d203357BF0'
}
// store factory address directly in frontend repo
export const FACTORY_ADDRESS = {
  43113: '0xC4331b86eF182b85c200CcCe1B132499019af3B5',
  42261: '0xB0c904E2aD98c78FF9Bc5d61006c6E5ab123CDfA',
  18: '0xc00d9cf36e1d223A815c8446694A165858B973Db'
}

export const SWAP_ROUTER = {
  43113: '0x34F289B3AB3d0f7876421d659478Cb848d90Fa44',
  42261: '0x9959c550652c8F0f08cE655828DE0285f9322407',
  18: '0x00c9ac8d414Ea3C7466F27431133dD989d8f20Df'
}

export const L1_CHAIN_IDS = [
  ChainId.BSC_MAINNET,
  ChainId.BSC_TESTNET,
  ChainId.AVAX_MAINNET,
  ChainId.AVAX_TESTNET,
  ChainId.OASIS_MAINNET,
  ChainId.OASIS_TESTNET,
  ChainId.QUARKCHAIN_DEV_S0,
  ChainId.TT_TESTNET
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
  readonly faucet?: string
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
    logoUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=023',
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
    logoUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=023',
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
    logoUrl: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=023',
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
    logoUrl: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=023',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    faucet: 'https://faucet.avax-test.network/'
  },
  [ChainId.MATIC_MAINNET]: {
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: 'https://wallet.polygon.technology/',
    docs: 'https://optimism.io/',
    explorer: 'https://polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/optimism',
    label: 'Polygon',
    logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.svg?v=023',
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
    logoUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.svg?v=023',
    nativeCurrency: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
    statusPage: 'https://optimism.io/status',
    faucet: 'https://faucet.polygon.technology/'
  },
  [ChainId.OASIS_MAINNET]: {
    blockWaitMsBeforeWarning: ms`10m`,
    // bridge: 'https://gateway.optimism.io/',
    docs: 'https://docs.oasis.dev/general/developer-resources/emerald-paratime',
    explorer: 'https://oasisscan.com/',
    infoLink: 'https://oasisprotocol.org/',
    label: 'Oasis Mainnet',
    rpcUrls: ['https://emerald.oasis.dev/'],
    logoUrl: 'https://cryptologos.cc/logos/oasis-network-rose-logo.svg?v=023',
    nativeCurrency: { name: 'Oasis', symbol: 'ROSE', decimals: 18 },
    // statusPage: 'https://optimism.io/status',
  },
  [ChainId.OASIS_TESTNET]: {
    blockWaitMsBeforeWarning: ms`10m`,
    // bridge: 'https://gateway.optimism.io/',
    docs: 'https://docs.oasis.dev/general/developer-resources/emerald-paratime',
    explorer: 'https://explorer.testnet.oasis.updev.si/',
    infoLink: 'https://oasisprotocol.org/',
    label: 'Oasis Testnet',
    rpcUrls: ['https://testnet.emerald.oasis.dev/'],
    logoUrl: 'https://cryptologos.cc/logos/oasis-network-rose-logo.svg?v=023',
    nativeCurrency: { name: 'Oasis', symbol: 'ROSE', decimals: 18 },
    faucet: 'https://faucet.testnet.oasis.dev/?'
    // statusPage: 'https://optimism.io/status',
  },
  [ChainId.QUARKCHAIN_DEV_S0]: {
    blockWaitMsBeforeWarning: ms`10m`,
    // bridge: 'https://gateway.optimism.io/',
    docs: 'https://developers.quarkchain.io/#introduction',
    explorer: 'https://devnet.quarkchain.io/',
    infoLink: 'https://oasisprotocol.org/',
    label: 'Quarkchain Dev S0',
    rpcUrls: ['http://eth-jrpc.devnet.quarkchain.io:39900'],
    logoUrl: 'https://cryptologos.cc/logos/quarkchain-qkc-logo.svg?v=023',
    nativeCurrency: { name: 'Quarkchain Dev S0', symbol: 'QKC', decimals: 10 },
    // statusPage: 'https://optimism.io/status',
  },
  [ChainId.TT_TESTNET]: {
    blockWaitMsBeforeWarning: ms`10m`,
    // bridge: 'https://gateway.optimism.io/',
    docs: 'https://docs.developers.thundercore.com/network-details/thundercore-testnet',
    explorer: 'https://explorer-testnet.thundercore.com/',
    infoLink: 'https://docs.developers.thundercore.com/',
    label: 'Thunder Testnet',
    rpcUrls: ['https://testnet-rpc.thundercore.com'],
    logoUrl: 'https://cryptologos.cc/logos/thorchain-rune-logo.svg?v=023',
    nativeCurrency: { name: 'Thunder Core Token', symbol: 'TT', decimals: 18 },
    faucet: 'https://faucet-testnet.thundercore.com/'
    // statusPage: 'https://optimism.io/status',
  },
}

export const FALLBACK_CHAINID = 42661

export const ALL_SUPPORTED_CHAIN_IDS = [
  ChainId.BSC_MAINNET, ChainId.BSC_TESTNET,
  ChainId.MATIC_TESTNET,
  ChainId.AVAX_MAINNET, ChainId.AVAX_TESTNET,
  ChainId.ARBITRUM_TETSNET_RINKEBY,
  ChainId.OASIS_MAINNET, ChainId.OASIS_TESTNET, ChainId.QUARKCHAIN_DEV_S0,
  ChainId.TT_TESTNET
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
  [ChainId.AVAX_TESTNET]: [
    WRAPPED_NETWORK_TOKENS[ChainId.AVAX_TESTNET], ABREQ[ChainId.AVAX_TESTNET],
    DAI[ChainId.AVAX_TESTNET], USDC[ChainId.AVAX_TESTNET],
    WETH[ChainId.AVAX_TESTNET], WBTC[ChainId.AVAX_TESTNET]
  ],
  [ChainId.MATIC_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_MAINNET]],
  [ChainId.MATIC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_TESTNET], REQT[ChainId.MATIC_TESTNET],
  USDC[ChainId.MATIC_TESTNET], DAI[ChainId.MATIC_TESTNET]],
  [ChainId.OASIS_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.OASIS_MAINNET]],
  [ChainId.OASIS_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.OASIS_TESTNET], ABREQ[ChainId.OASIS_TESTNET],
  USDT[ChainId.OASIS_TESTNET], DAI[ChainId.OASIS_TESTNET], USDC[ChainId.OASIS_TESTNET]],
  [ChainId.QUARKCHAIN_DEV_S0]: [WRAPPED_NETWORK_TOKENS[ChainId.QUARKCHAIN_DEV_S0], REQT[ChainId.QUARKCHAIN_DEV_S0],
  USDT[ChainId.QUARKCHAIN_DEV_S0], DAI[ChainId.QUARKCHAIN_DEV_S0], USDC[ChainId.QUARKCHAIN_DEV_S0]],
  [ChainId.TT_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.TT_TESTNET], ABREQ[ChainId.TT_TESTNET]],
  [ChainId.TT_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.TT_MAINNET]],


}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST_WEIGHTED: ChainTokenList = {
  [ChainId.BSC_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.BSC_MAINNET], CAKE[ChainId.BSC_MAINNET], BUSD[ChainId.BSC_MAINNET], USDT[ChainId.BSC_MAINNET], BTCB, UST, ETH[ChainId.BSC_MAINNET], USDC[ChainId.BSC_MAINNET]],
  [ChainId.BSC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.BSC_TESTNET], CAKE[ChainId.BSC_TESTNET], BUSD[ChainId.BSC_TESTNET], ETH[ChainId.BSC_TESTNET]],
  [ChainId.ARBITRUM_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.ARBITRUM_MAINNET]],
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: [WRAPPED_NETWORK_TOKENS[ChainId.ARBITRUM_TETSNET_RINKEBY]],
  [ChainId.AVAX_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.AVAX_MAINNET]],
  [ChainId.AVAX_TESTNET]: [
    WRAPPED_NETWORK_TOKENS[ChainId.AVAX_TESTNET], REQT[ChainId.AVAX_TESTNET],
    USDC[ChainId.AVAX_TESTNET], DAI[ChainId.AVAX_TESTNET],
    WETH[ChainId.AVAX_TESTNET], WBTC[ChainId.AVAX_TESTNET]
  ],
  [ChainId.MATIC_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_MAINNET]],
  [ChainId.MATIC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_TESTNET], REQT[ChainId.MATIC_TESTNET],
  USDC[ChainId.MATIC_TESTNET], DAI[ChainId.MATIC_TESTNET]],
  [ChainId.OASIS_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.OASIS_MAINNET]],
  [ChainId.OASIS_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.OASIS_TESTNET], REQT[ChainId.OASIS_TESTNET],
  USDC[ChainId.OASIS_TESTNET], DAI[ChainId.OASIS_TESTNET], TUSD[ChainId.OASIS_TESTNET]],
  [ChainId.QUARKCHAIN_DEV_S0]: [WRAPPED_NETWORK_TOKENS[ChainId.QUARKCHAIN_DEV_S0], REQT[ChainId.QUARKCHAIN_DEV_S0],
  USDC[ChainId.QUARKCHAIN_DEV_S0], DAI[ChainId.QUARKCHAIN_DEV_S0]],
  [ChainId.TT_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.TT_MAINNET]],
  [ChainId.TT_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.TT_TESTNET]],


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
  [ChainId.AVAX_TESTNET]: {},
}

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES: ChainTokenList = {
  [ChainId.BSC_MAINNET]: [BUSD[ChainId.BSC_MAINNET], CAKE[ChainId.BSC_MAINNET], BTCB],
  [ChainId.BSC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.BSC_TESTNET], CAKE[ChainId.BSC_TESTNET], BUSD[ChainId.BSC_TESTNET]],
  [ChainId.ARBITRUM_MAINNET]: [],
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: [],
  [ChainId.AVAX_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.AVAX_MAINNET]],
  [ChainId.AVAX_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.AVAX_TESTNET], USDT[ChainId.AVAX_TESTNET]],
  [ChainId.MATIC_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_MAINNET], USDC[ChainId.MATIC_MAINNET]],
  [ChainId.MATIC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_TESTNET], USDC[ChainId.MATIC_TESTNET]],
  [ChainId.OASIS_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.OASIS_MAINNET]],
  [ChainId.OASIS_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.OASIS_TESTNET], USDT[ChainId.OASIS_TESTNET]],
  [ChainId.QUARKCHAIN_DEV_S0]: [WRAPPED_NETWORK_TOKENS[ChainId.QUARKCHAIN_DEV_S0], USDT[ChainId.QUARKCHAIN_DEV_S0]],
  [ChainId.TT_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.TT_TESTNET], USDC[ChainId.TT_TESTNET]],
  [ChainId.TT_MAINNET]: [WRAPPED_NETWORK_TOKENS[ChainId.TT_MAINNET], USDC[ChainId.TT_MAINNET]],
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
  [ChainId.MATIC_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.MATIC_TESTNET], USDC[ChainId.MATIC_TESTNET]],
  [ChainId.OASIS_MAINNET]: [],
  [ChainId.OASIS_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.OASIS_TESTNET], USDT[ChainId.OASIS_TESTNET]],
  [ChainId.QUARKCHAIN_DEV_S0]: [WRAPPED_NETWORK_TOKENS[ChainId.QUARKCHAIN_DEV_S0], USDT[ChainId.QUARKCHAIN_DEV_S0]],
  [ChainId.TT_TESTNET]: [WRAPPED_NETWORK_TOKENS[ChainId.TT_TESTNET], USDC[ChainId.TT_TESTNET]],
  [ChainId.TT_MAINNET]: [],
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

export const BIG_INT_ZERO = BigNumber.from(0)

// one basis point
export const ONE_BIPS = new Percent(BigNumber.from(1), BigNumber.from(10000))
export const BIPS_BASE = BigNumber.from(10000)

// transaction popup dismisal amounts
export const DEFAULT_TXN_DISMISS_MS = 25000

// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(BigNumber.from(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(BigNumber.from(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(BigNumber.from(500), BIPS_BASE) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(BigNumber.from(1000), BIPS_BASE) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(BigNumber.from(1500), BIPS_BASE) // 15%

// used to ensure the user doesn't send so much BNB so they end up with <.01
export const MIN_NETWORK_CCY = BigNumber.from(10).pow(16) // .01 BNB
export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(BigNumber.from(50), BigNumber.from(10000))

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

export { default as farmsConfig } from './farms'
export { default as ifosConfig } from './ifo'

// data for weighted pools
export const STANDARD_FEES = [5, 10, 15, 20, 25]
export const STANDARD_WEIGHTS = [20, 50, 80]