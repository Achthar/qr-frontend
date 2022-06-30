import { useEffect, useState, useRef } from 'react'

import { Web3Provider } from '@ethersproject/providers'
import { simpleRpcProvider } from 'utils/providers'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { useWeb3React } from '@web3-react/core'
// eslint-disable-next-line import/no-unresolved
import { Web3ReactContextInterface } from '@web3-react/core/dist/types'
import { useChainIdHandling } from './useChainIdHandle'

const supportedChains = [43113]

/**
 * Provides a web3 provider with or without user's signer
 * Recreate web3 instance only if the provider change
 */
const useActiveWeb3React = (): Web3ReactContextInterface<Web3Provider> => {
  const { library, chainId: chainIdWeb3, ...web3React } = useWeb3React()

  useChainIdHandling(chainIdWeb3, web3React.account)
  const { chainId } = useNetworkState()

  const refEth = useRef(library)

  const [provider, setprovider] = useState(library || simpleRpcProvider(chainId))

  useEffect(() => {
    if (library !== refEth.current) {
      setprovider(library || simpleRpcProvider(chainId))
      refEth.current = library
    }
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chainId, library])

  return { library: provider, chainId, ...web3React }
}

export default useActiveWeb3React
