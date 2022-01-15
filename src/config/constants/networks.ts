import { ChainId } from '@requiemswap/sdk'

const NETWORK_URLS: { [chainId in ChainId]?: string } = {
  [ChainId.BSC_MAINNET]: 'https://bsc-dataseed1.defibit.io',
  [ChainId.BSC_TESTNET]: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  [ChainId.ARBITRUM_MAINNET]: '',
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: '',
  [ChainId.AVAX_MAINNET]: 'https://api.avax.network/ext/bc/C/rpc',
  [ChainId.AVAX_TESTNET]: 'https://api.avax-test.network/ext/bc/C/rpc',
  [ChainId.MATIC_MAINNET]: '',
  [ChainId.MATIC_TESTNET]: 'https://rpc-mumbai.matic.today',
  [ChainId.OASIS_MAINNET]: '',
  [ChainId.OASIS_TESTNET]: 'https://testnet.emerald.oasis.dev',
  [ChainId.QUARKCHAIN_DEV_S0]: 'http://eth-jrpc.devnet.quarkchain.io:3990'
}

export default NETWORK_URLS
