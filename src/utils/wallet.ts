// Set of helper functions to facilitate wallet setup

import { BASE_URL, BASE_EXPLORER_URLS } from 'config'
import { BigNumber } from '@ethersproject/bignumber'
import { hexStripZeros } from '@ethersproject/bytes'
import { CHAIN_INFO } from 'config/constants/index'
import { Web3Provider } from '@ethersproject/providers'
import { ChainId } from '@requiemswap/sdk'
import { nodes } from './getRpcUrl'

/**
 * Prompt the user to add BSC as a network on Metamask, or switch to BSC if the wallet is on a different network
 * @returns {boolean} true if the setup succeeded, false otherwise
 */
export const setupNetwork = async (chainId: number, library?: Web3Provider) => {
  const provider = window.ethereum
  if (provider) {
    // const chainId = parseInt(process.env.REACT_APP_CHAIN_ID, 10)
    const formattedChainId = hexStripZeros(BigNumber.from(chainId ?? 43113).toHexString()) // chainId === 43113 ? chainId : hexStripZeros(BigNumber.from(chainId).toHexString())
    try {
      if (!chainId && library?.getNetwork) {
        ({ chainId } = await library.getNetwork())
      }
      if (chainId === 56 || chainId === 97) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: formattedChainId,
              chainName: CHAIN_INFO[chainId].label,
              nativeCurrency: {
                name: CHAIN_INFO[chainId].nativeCurrency,
                symbol: CHAIN_INFO[chainId].nativeCurrency,
                decimals: 18,
              },
              rpcUrls: CHAIN_INFO[chainId].rpcUrls,
              blockExplorerUrls: [CHAIN_INFO[chainId].explorer],
            },
          ],
        })
      } else {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: formattedChainId,
              chainName: CHAIN_INFO[chainId ?? 43113].label,
              rpcUrls: CHAIN_INFO[chainId ?? 43113].rpcUrls,
              nativeCurrency: CHAIN_INFO[chainId ?? 43113].nativeCurrency,
              blockExplorerUrls: [CHAIN_INFO[chainId ?? 43113].explorer],
            },
          ],
        })
      }
      return true
    } catch (error: any) {
      console.error('Failed to setup the network in Metamask:', error)
      return false
    }
  } else {
    console.error(`Can't setup the ${CHAIN_INFO[chainId].nativeCurrency} network on metamask because window.ethereum is undefined`)
    return false
  }
}

/**
 * Prompt the user to add a custom token to metamask
 * @param tokenAddress
 * @param tokenSymbol
 * @param tokenDecimals
 * @returns {boolean} true if the token has been added, false otherwise
 */
export const registerToken = async (tokenAddress: string, tokenSymbol: string, tokenDecimals: number) => {
  const tokenAdded = await window.ethereum.request({
    method: 'wallet_watchAsset',
    params: {
      type: 'ERC20',
      options: {
        address: tokenAddress,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        image: `${BASE_URL}/images/tokens/${tokenAddress}.png`,
      },
    },
  })

  return tokenAdded
}
