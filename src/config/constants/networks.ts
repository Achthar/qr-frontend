// import { ChainId } from '@pancakeswap/sdk'
import { ChainId } from '../index'

const NETWORK_URLS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET_BSC]: 'https://bsc-dataseed1.defibit.io',
  [ChainId.TESTNET_BSC]: 'https://data-seed-prebsc-1-s1.binance.org:8545',
}

export default NETWORK_URLS
