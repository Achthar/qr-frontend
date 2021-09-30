import { ChainId } from '@pancakeswap/sdk'

const NETWORK_URLS: { [chainId in ChainId]: string } = {
  [ChainId.BSC_MAINNET]: 'https://bsc-dataseed1.defibit.io',
  [ChainId.BSC_TESTNET]: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  [ChainId.ARBITRUM_MAINNET]:'',
  [ChainId.ARBITRUM_TETSNET_RINKEBY]:'',
  [ChainId.AVAX_MAINNET]:'',
  [ChainId.AVAX_TESTNET]:'',
  [ChainId.MATIC_MAINNET]:'',
  [ChainId.MATIC_TESTNET]:'https://rpc-mumbai.matic.today',
}

export default NETWORK_URLS
