import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'

import { ChainId } from '@pancakeswap/sdk'
import { ALL_SUPPORTED_CHAIN_IDS } from '../config/constants/index'
import { NetworkConnector } from './NetworkConnector'
import getLibrary from 'utils/getLibrary'

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY
// const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
// const PORTIS_ID = process.env.REACT_APP_PORTIS_ID

if (typeof INFURA_KEY === 'undefined') {
  throw new Error(`REACT_APP_INFURA_KEY must be a defined environment variable`)
}

const NETWORK_URLS: { [key in ChainId]: string } = {
  // [ChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  [ChainId.BSC_MAINNET]: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
  [ChainId.BSC_TESTNET]: `https://ropsten.infura.io/v3/${INFURA_KEY}`,
  [ChainId.MATIC_MAINNET]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
  [ChainId.MATIC_TESTNET]: `https://kovan.infura.io/v3/${INFURA_KEY}`,
  [ChainId.AVAX_MAINNET]: `https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`,
  [ChainId.AVAX_TESTNET]: `https://optimism-kovan.infura.io/v3/${INFURA_KEY}`,
  [ChainId.ARBITRUM_MAINNET]: `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
  [ChainId.ARBITRUM_TETSNET_RINKEBY]: `https://arbitrum-rinkeby.infura.io/v3/${INFURA_KEY}`,
}

export const network = new NetworkConnector({
  urls: NETWORK_URLS,
  defaultChainId: 1,
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? getLibrary(network.provider))
}

export const injected = new InjectedConnector({
  supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
})


export const walletconnect = new WalletConnectConnector({
  supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
  rpc: NETWORK_URLS,
  qrcode: true,
})
