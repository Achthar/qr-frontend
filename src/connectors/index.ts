/* eslint no-return-assign: 0 */

import { Web3Provider } from '@ethersproject/providers'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { ChainId } from '@requiemswap/sdk'
import getLibrary from 'utils/getLibrary'
import { NetworkConnector } from './NetworkConnector'
import { ALL_SUPPORTED_CHAIN_IDS } from '../config/constants/index'


export interface WalletInfo {
  connector?: AbstractConnector
  name: string
  iconName: string
  description: string
  href: string | null
  color: string
  primary?: true
  mobile?: true
  mobileOnly?: true
}

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY
// const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
// const PORTIS_ID = process.env.REACT_APP_PORTIS_ID

if (typeof INFURA_KEY === 'undefined') {
  throw new Error(`REACT_APP_INFURA_KEY must be a defined environment variable`)
}

const NETWORK_URLS: { [key in ChainId]?: string } = {
  [ChainId.BSC_MAINNET]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
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
  defaultChainId: 43113,
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? getLibrary(network.provider))
}

export const injected = new InjectedConnector({
  supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
})

export const walletlink = new WalletLinkConnector({
  url: NETWORK_URLS[ChainId.AVAX_MAINNET],
  appName: 'Requiem Finance',
  appLogoUrl: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/requiem/REQT_no_background.svg'
})


export const walletconnect = new WalletConnectConnector({
  supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
  rpc: NETWORK_URLS,
  qrcode: true,
})

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
  INJECTED: {
    connector: injected,
    name: 'Injected',
    iconName: 'arrow-right.svg',
    description: 'Injected web3 provider.',
    href: null,
    color: '#010101',
    primary: true
  },
  METAMASK: {
    connector: injected,
    name: 'MetaMask',
    iconName: 'metamask.png',
    description: 'Easy-to-use browser extension.',
    href: null,
    color: '#E8831D'
  },
  WALLET_LINK: {
    connector: walletlink,
    name: 'Coinbase Wallet',
    iconName: 'coinbaseWalletIcon.svg',
    description: 'Use Coinbase Wallet app on mobile device',
    href: null,
    color: '#315CF5',
  },
  WALLET_CONNECT: {
    connector: walletconnect,
    name: 'Wallet Connect',
    iconName: 'walletConnectIcon.svg',
    description: 'Use Wallet Connect',
    href: null,
    color: '#315CF5',
  },
}