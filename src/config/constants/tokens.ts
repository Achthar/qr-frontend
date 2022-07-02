import { ChainId, Token, STABLE_POOL_LP_ADDRESS } from '@requiemswap/sdk'
import { getAddress } from 'ethers/lib/utils'
import { serializeToken } from 'state/user/hooks/helpers'
import { SerializedToken } from './types'


interface TokenList {
  [symbol: string]: Token
}

interface SerializedTokenList {
  [symbol: string]: SerializedToken
}

export const LINK = {
  [ChainId.AVAX_TESTNET]: new Token(
    ChainId.AVAX_TESTNET,
    '0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846',
    18,
    'LINK',
    'ChainLink Token'
  )
}

export const WETH = {
  [ChainId.BSC_MAINNET]: new Token(
    ChainId.BSC_MAINNET,
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    18,
    'WETH',
    'Wrapped ETH'
  ),
  [ChainId.BSC_TESTNET]: new Token(
    ChainId.BSC_TESTNET,
    '0xaE8E19eFB41e7b96815649A6a60785e1fbA84C1e',
    18,
    'WETH',
    'Wrapped ETH'
  ),
  [ChainId.AVAX_TESTNET]: new Token(
    ChainId.AVAX_TESTNET,
    '0x70dC2c5F81BC18e115759398aF197e99f228f713',
    18,
    'WETH',
    'Wrapped ETH',
  ),
  [ChainId.OASIS_TESTNET]: new Token(
    ChainId.OASIS_TESTNET,
    '0xf7fCD3BEB3CA6cB131d44fA67931cFAEC7dE013b',
    18,
    'WETH',
    'Wrapped ETH',
  ),
  [ChainId.QUARKCHAIN_DEV_S0]: new Token(
    ChainId.OASIS_TESTNET,
    '0x6116979278577af89C51f108e802569C6456fa00',
    18,
    'WETH',
    'Wrapped ETH',
  ),
}

export const STABLE_POOL_LP = {
  [ChainId.AVAX_TESTNET]: new Token(ChainId.AVAX_TESTNET, STABLE_POOL_LP_ADDRESS[ChainId.AVAX_TESTNET], 18, 'RSLP', 'Requiem Stable LP'),
  [ChainId.OASIS_TESTNET]: new Token(ChainId.OASIS_TESTNET, STABLE_POOL_LP_ADDRESS[ChainId.OASIS_TESTNET], 18, 'RSLP', 'Requiem Stable LP'),
  [ChainId.QUARKCHAIN_DEV_S0]: new Token(ChainId.QUARKCHAIN_DEV_S0, STABLE_POOL_LP_ADDRESS[ChainId.QUARKCHAIN_DEV_S0], 18, 'RSLP', 'Requiem Stable LP')
}

export const REQT: { [chainId: number]: Token } = {
  [ChainId.BSC_MAINNET]: new Token(
    ChainId.BSC_MAINNET,
    '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    18,
    'CAKE',
    'PancakeSwap Token',
  ),
  [ChainId.MATIC_TESTNET]: new Token(
    ChainId.MATIC_TESTNET,
    '0xa35062141Fa33BCA92Ce69FeD37D0E8908868AAe',
    18,
    'REQT',
    'Requiem Token',
  ),
  [ChainId.AVAX_TESTNET]: new Token(
    ChainId.AVAX_TESTNET,
    '0x64796164fe724798d07CaFe6D19c05b5276A3903',
    18,
    'REQA',
    'Requiem Alpha',
  ), // not deployed yet, but dummy needed
  [ChainId.OASIS_TESTNET]: new Token(
    ChainId.OASIS_TESTNET,
    '0xB6bcC8b771ef17b50e6B7Cc53F18dB81498691DB',
    18,
    'REQT',
    'Requiem Token',
  ),
  [ChainId.QUARKCHAIN_DEV_S0]: new Token(
    ChainId.QUARKCHAIN_DEV_S0,
    '0x36A82d7B21Da814951a8a04f2e094Ee9b01f3f58',
    18,
    'WETH',
    'Wrapped ETH',
  ),
}

export const ABREQ: { [chainId: number]: Token } = {
  [ChainId.AVAX_TESTNET]: new Token(
    ChainId.AVAX_TESTNET,
    '0x337AaE5Dd7e0b98d3F558E2eeeA6cE5b9A5b3E63',
    18,
    'abREQ',
    'Asset-Backed Requiem Token',
  ),
}

export const SREQ: { [chainId: number]: Token } = {
  [ChainId.AVAX_TESTNET]: new Token(
    ChainId.AVAX_TESTNET,
    '0x754A5Efde9E5Aec67A8983989E85bd3B0dBB112e',
    18,
    'sREQ',
    'Staked Requiem',
  ),
}

export const GREQ: { [chainId: number]: Token } = {
  [ChainId.AVAX_TESTNET]: new Token(
    ChainId.AVAX_TESTNET,
    '0x147F7feF8C1c46B7Fc9eE790eE95A041F255F022',
    18,
    'gREQ',
    'Governance Requiem',
  ),
}

export const WEIGHTED_POOL_LP: { [chainId: number]: Token } = {
  [ChainId.AVAX_TESTNET]: new Token(
    ChainId.AVAX_TESTNET,
    '0xa63a39F656E0890857987Dfc0AEB90654Bc231B1',
    18,
    'Requiem Weighted LP',
    'RWLP',
  ),
}

export const RREQT: { [chainId: number]: Token } = {
  [ChainId.BSC_MAINNET]: new Token(
    ChainId.BSC_MAINNET,
    '0x2AadF607A5260f8223c4b604297Cf7DC31926Ada',
    18,
    'CAKE',
    'PancakeSwap Token',
  ),
  [ChainId.MATIC_TESTNET]: new Token(
    ChainId.MATIC_TESTNET,
    '0x2AadF607A5260f8223c4b604297Cf7DC31926Ada',
    18,
    'REQT',
    'Requiem Token',
  ),
  [ChainId.AVAX_TESTNET]: new Token(
    ChainId.AVAX_TESTNET,
    '0x2AadF607A5260f8223c4b604297Cf7DC31926Ada',
    18,
    'AGREQ',
    'Alpha Governance Requiem',
  ), // not deployed yet, but dummy needed
  [ChainId.OASIS_TESTNET]: new Token(
    ChainId.OASIS_TESTNET,
    '0x2AadF607A5260f8223c4b604297Cf7DC31926Ada',
    18,
    'REQT',
    'Requiem Token',
  ),
  [ChainId.QUARKCHAIN_DEV_S0]: new Token(
    ChainId.QUARKCHAIN_DEV_S0,
    '0x2AadF607A5260f8223c4b604297Cf7DC31926Ada',
    18,
    'WETH',
    'Wrapped ETH',
  ),
}

export const CAKE: { [chainId: number]: Token } = {
  [ChainId.BSC_MAINNET]: new Token(
    ChainId.BSC_MAINNET,
    '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    18,
    'CAKE',
    'PancakeSwap Token',
  ),
  [ChainId.BSC_TESTNET]: new Token(
    ChainId.BSC_TESTNET,
    '0xa35062141Fa33BCA92Ce69FeD37D0E8908868AAe',
    18,
    'CAKE',
    'PancakeSwap Token',
  ),
}
export const BUSD: { [chainId: number]: Token } = {
  [ChainId.BSC_MAINNET]: new Token(
    ChainId.BSC_MAINNET,
    '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    18,
    'BUSD',
    'Binance USD',
  ),
  [ChainId.BSC_TESTNET]: new Token(
    ChainId.BSC_TESTNET,
    '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
    18,
    'BUSD',
    'Binance USD',
  ),
}

export const WBNB: { [chainId: number]: Token } = {
  [ChainId.BSC_MAINNET]: new Token(
    ChainId.BSC_MAINNET,
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    18,
    'WBNB',
    'Wrapped BNB',
  ),
  [ChainId.BSC_TESTNET]: new Token(
    ChainId.BSC_TESTNET,
    '0xae13d989dac2f0debff460ac112a837c89baa7cd',
    18,
    'WBNB',
    'Wrapped BNB',
  ),
}
export const DAI: { [chainId: number]: Token } = {
  [ChainId.BSC_MAINNET]: new Token(
    ChainId.BSC_MAINNET,
    '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.BSC_TESTNET]: new Token(
    ChainId.BSC_TESTNET,
    '0x8a9424745056eb399fd19a0ec26a14316684e274',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.MATIC_TESTNET]: new Token(
    ChainId.MATIC_TESTNET,
    '0x001b3b4d0f3714ca98ba10f6042daebf0b1b7b6f',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.AVAX_TESTNET]: new Token(
    ChainId.AVAX_TESTNET,
    '0xaea51e4fee50a980928b4353e852797b54deacd8',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.QUARKCHAIN_DEV_S0]: new Token(
    ChainId.QUARKCHAIN_DEV_S0,
    '0x51b90a5Bc99B7c76EDf3863E1d61ca6197a6e542',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
  [ChainId.OASIS_TESTNET]: new Token(
    ChainId.OASIS_TESTNET,
    '0xf10Bd0dA1f0e69c3334D7F8116C9082746EBC1B4',
    18,
    'DAI',
    'Dai Stablecoin',
  ),
}
export const USDT: { [chainId: number]: Token } = {
  [ChainId.BSC_MAINNET]: new Token(
    ChainId.BSC_MAINNET,
    '0x55d398326f99059fF775485246999027B3197955',
    18, 'USDT', 'Tether USD'),
  [ChainId.AVAX_TESTNET]: new Token(ChainId.AVAX_TESTNET, '0xffb3ed4960cac85372e6838fbc9ce47bcf2d073e', 6, 'USDT', 'Tether USD'),
  [ChainId.AVAX_MAINNET]: new Token(ChainId.AVAX_MAINNET, '0xde3A24028580884448a5397872046a019649b084', 6, 'USDT', 'Tether USD'),
  [ChainId.QUARKCHAIN_DEV_S0]: new Token(ChainId.QUARKCHAIN_DEV_S0, '0x1a69a6e206c680A8559c59b951527437CBCe6Ed7', 6, 'USDT', 'Tether USD'),
  [ChainId.OASIS_TESTNET]: new Token(ChainId.OASIS_TESTNET, '0xfA0D8065755Fb3b6520149e86Ac5A3Dc3ee5Dc92', 6, 'USDT', 'Tether USD'),
}
export const BTCB = new Token(ChainId.BSC_MAINNET, '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', 18, 'BTCB', 'Binance BTC')


export const WBTC: { [chainId: number]: Token } = {
  [ChainId.AVAX_TESTNET]: new Token(
    ChainId.AVAX_TESTNET,
    '0x31AbD3aA54cb7bdda3f52e304A5Ed9c1a783D289',
    8,
    'WBTC',
    'Wrapped BTC',
  ),
  [ChainId.OASIS_TESTNET]: new Token(
    ChainId.OASIS_TESTNET,
    '0xE88Cae7399bd545b9eD47aba7ec158e29e480EDb',
    8,
    'WBTC',
    'Wrapped BTC',
  ),
  [ChainId.QUARKCHAIN_DEV_S0]: new Token(
    ChainId.QUARKCHAIN_DEV_S0,
    '0x1e32DAE021A5B2c9546a5aF148984Fa278f09D9a',
    8,
    'WBTC',
    'Wrapped BTC',
  ),
}

export const UST = new Token(
  ChainId.BSC_MAINNET,
  '0x23396cF899Ca06c4472205fC903bDB4de249D6fC',
  18,
  'UST',
  'Wrapped UST Token',
)
export const ETH: { [chainId: number]: Token } = {
  [ChainId.BSC_MAINNET]: new Token(
    ChainId.BSC_MAINNET,
    '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    18,
    'ETH',
    'Binance-Peg Ethereum Token',
  ),
  [ChainId.BSC_TESTNET]: new Token(
    ChainId.BSC_TESTNET,
    '0x8babbb98678facc7342735486c851abd7a0d17ca',
    18,
    'ETH',
    'Binance-Peg Ethereum Token',
  ),
}

export const USDC: { [chainId: number]: Token } = {
  [ChainId.BSC_MAINNET]: new Token(
    ChainId.BSC_MAINNET,
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    6,
    'USDC',
    'Binance-Peg USD Coin',
  ),
  [ChainId.MATIC_TESTNET]: new Token(
    ChainId.MATIC_TESTNET,
    '0x2058a9d7613eee744279e3856ef0eada5fcbaa7e',
    6,
    'USDC',
    'USD Coin',
  ),
  [ChainId.AVAX_TESTNET]: new Token(
    ChainId.AVAX_TESTNET,
    '0xca9ec7085ed564154a9233e1e7d8fef460438eea',
    6,
    'USDC',
    'USD Coin',
  ),
  [ChainId.QUARKCHAIN_DEV_S0]: new Token(
    ChainId.QUARKCHAIN_DEV_S0,
    '0xE59c1Ddf4fAAC4Fa7C8c93d9392d4bBa55383268',
    6,
    'USDC',
    'USD Coin',
  ),
  [ChainId.OASIS_TESTNET]: new Token(
    ChainId.OASIS_TESTNET,
    '0x9aEeeD65aE87e3b28793aefAeED59c3f10ef956b',
    6,
    'USDC',
    'USD Coin',
  ),

}
export const TUSD: { [chainId: number]: Token } = {
  [ChainId.AVAX_TESTNET]: new Token(
    ChainId.AVAX_TESTNET,
    '0xccf7ed44c5a0f3cb5c9a9b9f765f8d836fb93ba1',
    18,
    'TUSD',
    'True USD',
  ), [ChainId.QUARKCHAIN_DEV_S0]: new Token(
    ChainId.QUARKCHAIN_DEV_S0,
    '0xD71C821a373E16D607277DB6C1356c1209C7d866',
    18,
    'TUSD',
    'True USD',
  ), [ChainId.OASIS_TESTNET]: new Token(
    ChainId.OASIS_TESTNET,
    '0x4e8848da06E40E866b82f6b52417494936c9509b',
    18,
    'TUSD',
    'True USD',
  ),
}

export const STABLES = {
  [ChainId.AVAX_TESTNET]:
    [
      USDC[ChainId.AVAX_TESTNET],
      USDT[ChainId.AVAX_TESTNET],
      DAI[ChainId.AVAX_TESTNET],
      TUSD[ChainId.AVAX_TESTNET]
    ],
  [ChainId.OASIS_TESTNET]:
    [
      USDC[ChainId.OASIS_TESTNET],
      USDT[ChainId.OASIS_TESTNET],
      DAI[ChainId.OASIS_TESTNET],
      TUSD[ChainId.OASIS_TESTNET]
    ],
}

export const STABLES_DICT = {
  [ChainId.AVAX_TESTNET]: {
    [USDT[ChainId.AVAX_TESTNET].address]: USDT[ChainId.AVAX_TESTNET],
    [USDC[ChainId.AVAX_TESTNET].address]: USDC[ChainId.AVAX_TESTNET],
    [DAI[ChainId.AVAX_TESTNET].address]: DAI[ChainId.AVAX_TESTNET],
    [TUSD[ChainId.AVAX_TESTNET].address]: TUSD[ChainId.AVAX_TESTNET]

  },
  [ChainId.OASIS_TESTNET]: {
    [USDT[ChainId.OASIS_TESTNET].address]: USDT[ChainId.OASIS_TESTNET],
    [USDC[ChainId.OASIS_TESTNET].address]: USDC[ChainId.OASIS_TESTNET],
    [DAI[ChainId.OASIS_TESTNET].address]: DAI[ChainId.OASIS_TESTNET],
    [TUSD[ChainId.OASIS_TESTNET].address]: TUSD[ChainId.OASIS_TESTNET]

  }
}

export interface TokenEntry {
  symbol: string
  address: { [chainId: number]: string }
  decimals: number
  projectLink?: string
}

const tokens: { [tokenId: string]: TokenEntry } = {
  // 'bnb': {
  //   symbol: 'BNB',
  //   projectLink: 'https://www.binance.com/',
  // },
  'cake': {
    symbol: 'CAKE',
    address: {
      56: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
      97: '0xa35062141Fa33BCA92Ce69FeD37D0E8908868AAe',
    },
    decimals: 18,
    projectLink: 'https://pancakeswap.finance/',
  },
  'reqt': {
    symbol: 'REQT',
    address: {
      56: '',
      97: '',
      80001: '0xFf25c956BA06Beb3f69a09E7c3c2974Fa4121Df8',
      43113: '0x64796164fe724798d07CaFe6D19c05b5276A3903',
      43114: '0x64796164fe724798d07CaFe6D19c05b5276A3903',
      110001: '0x36A82d7B21Da814951a8a04f2e094Ee9b01f3f58',
    },
    decimals: 18,
    projectLink: 'https://pancakeswap.finance/',
  },
  'abreq': {
    symbol: 'abREQ',
    address: {
      56: '',
      97: '',
      80001: '0xFf25c956BA06Beb3f69a09E7c3c2974Fa4121Df8',
      43113: '0x337AaE5Dd7e0b98d3F558E2eeeA6cE5b9A5b3E63',
      43114: '0x337AaE5Dd7e0b98d3F558E2eeeA6cE5b9A5b3E63',
      110001: '0x36A82d7B21Da814951a8a04f2e094Ee9b01f3f58',
    },
    decimals: 18,
    projectLink: 'https://pancakeswap.finance/',
  },
  'wmatic': {
    symbol: 'WMATIC',
    address: {
      80001: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889'
    },
    decimals: 18,
    projectLink: ''
  },
  'wavax': {
    symbol: 'WAVAX',
    address: {
      43113: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',
      43314: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
    },
    decimals: 18,
    projectLink: ''
  },
  'usdt': {

    symbol: 'USDT',
    address: {
      43113: '0xffb3ed4960cac85372e6838fbc9ce47bcf2d073e',
      110001: '0x1a69a6e206c680A8559c59b951527437CBCe6Ed7'
    },
    decimals: 6,
    projectLink: ''
  },
  'dai': {
    symbol: 'DAI',
    address: {
      43113: '0xaea51e4fee50a980928b4353e852797b54deacd8',
      110001: '0x51b90a5Bc99B7c76EDf3863E1d61ca6197a6e542'
    },
    decimals: 18,
    projectLink: ''
  },
  'usdc': {
    symbol: 'USDC',
    address: {
      43113: '0xca9ec7085ed564154a9233e1e7d8fef460438eea',
      110001: '0xE59c1Ddf4fAAC4Fa7C8c93d9392d4bBa55383268'
    },
    decimals: 6,
    projectLink: ''
  },
  'tusd': {
    symbol: 'TUSD',
    address: {
      43113: '0xccf7ed44c5a0f3cb5c9a9b9f765f8d836fb93ba1',
      110001: '0xD71C821a373E16D607277DB6C1356c1209C7d866'
    },
    decimals: 18,
    projectLink: ''
  },
  'weth': {
    address: { 43113: '0x70dC2c5F81BC18e115759398aF197e99f228f713' },
    decimals: 18,
    symbol: 'WETH'
  },
  'wbtc': {
    address: { 43113: '0x31AbD3aA54cb7bdda3f52e304A5Ed9c1a783D289' },
    decimals: 8,
    symbol: 'WBTC',
  },
  'link': {
    address: { 43113: '0x10E38dFfFCfdBaaf590D5A9958B01C9cfcF6A63B' },
    decimals: 18,
    symbol: 'LINK'
  }
}

// const tokenList = (): TokenList => {
//   const chainId = process.env.REACT_APP_CHAIN_ID

//   // // If testnet - return list comprised of testnetTokens wherever they exist, and mainnetTokens where they don't
//   // if (parseInt(chainId, 10) === ChainId.BSC_TESTNET) {
//   //   return Object.keys(tokens).reduce((accum, key) => {
//   //     return { ...accum, [key]: testnetTokens[key] || mainnetTokens[key] }
//   //   }, {})
//   // }

//   return Object.keys(tokens).map(id => new Token(chainId, tokens[id].address[chainId], tokens[id].decimals, tokebns[id].symbol, tokens[id].name))
// }

export const serializeTokens = (chainId: number): SerializedTokenList => {
  // const unserializedTokens = tokens // tokenList()
  // const serializedTokens = Object.keys(tokens).reduce((accum, key) => {
  //   return { ...accum, [key]: getSerializedToken(chainId, tokens[key]) }
  // }, {})
  // return serializedTokens
  const filtered = Object.fromEntries(Object.entries(tokens).filter(([k, v]) => v.address[chainId] !== undefined));
  const dict = Object.assign({}, ...Object.keys(filtered).map((token) => ({ [token]: getSerializedToken(chainId, filtered[token]) })));
  return dict

}


export const getSerializedToken = (chainId: number, entry: any): SerializedToken => {
  return {
    chainId,
    address: getAddress(entry.address[chainId]),
    decimals: entry.decimals,
    symbol: entry.symbol,
    name: entry.name,
  }
}
export default tokens
