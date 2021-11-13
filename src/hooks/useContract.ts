
/* eslint-disable camelcase */
import { useMemo } from 'react'
import { useWeb3React } from '@web3-react/core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import {
  getBep20Contract,
  getCakeContract,
  getIfoV2Contract,
  getMasterchefContract,
  getPointCenterIfoContract,
  getSouschefContract,
  getClaimRefundContract,
  getErc721Contract,
  getCakeVaultContract,
  getPredictionsContract,
  getChainlinkOracleContract,
  getSouschefV2Contract,
  getLotteryV2Contract,
  getFarmAuctionContract,
} from 'utils/contractHelpers'
import { getMulticallAddress } from 'utils/addressHelpers'
import { useNetworkState } from 'state/globalNetwork/hooks'

// Imports below migrated from Exchange useContract.ts
import { Contract } from '@ethersproject/contracts'
import { WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import ENS_PUBLIC_RESOLVER_ABI from '../config/abi/ens-public-resolver.json'
import ENS_ABI from '../config/abi/ens-registrar.json'
import { ERC20_BYTES32_ABI } from '../config/abi/erc20'
import ERC20_ABI from '../config/abi/erc20.json'
import WETH_ABI from '../config/abi/weth.json'
import WAVAX_ABI from '../config/abi/avax/wavax.json'
import multiCallAbi from '../config/abi/Multicall.json'
import multiCallAbi_AVAX from '../config/abi/avax/Multicall.json'
import stableLp_AVAX from '../config/abi/avax/IERC20.json'
import { getContract } from '../utils'
import { ChainId } from '../config/index'



/**
 * Helper hooks to get specific contracts (by ABI)
 */

export const useIfoV2Contract = (address: string) => {
  const { library, chainId } = useActiveWeb3React("useIfoV2Contract")
  return useMemo(() => getIfoV2Contract(chainId, address, library.getSigner()), [chainId, address, library])
}

export const useERC20 = (address: string) => {
  const { library, chainId } = useActiveWeb3React("useERC20")
  return useMemo(() => getBep20Contract(chainId, address, library.getSigner()), [chainId, address, library])
}

/**
 * @see https://docs.openzeppelin.com/contracts/3.x/api/token/erc721
 */
export const useERC721 = (address: string) => {
  const { library, chainId } = useActiveWeb3React("useERC721")
  return useMemo(() => getErc721Contract(chainId, address, library.getSigner()), [chainId, address, library])
}

export const useCake = () => {
  const { library, chainId } = useActiveWeb3React("useCake")
  return useMemo(() => getCakeContract(chainId, library.getSigner()), [chainId, library])
}

export const useLotteryV2Contract = () => {
  const { library, chainId } = useActiveWeb3React("useLotteryV2Contract")
  return useMemo(() => getLotteryV2Contract(chainId, library.getSigner()), [chainId, library])
}

export const useMasterchef = () => {
  const { library, chainId } = useActiveWeb3React("useMasterchef")
  return useMemo(() => getMasterchefContract(chainId, library.getSigner()), [chainId, library])
}

export const useSousChef = (id) => {
  const { library, chainId } = useActiveWeb3React("useSousChef")
  return useMemo(() => getSouschefContract(chainId, id, library.getSigner()), [chainId, id, library])
}

export const useSousChefV2 = (id) => {
  const { library, chainId } = useActiveWeb3React("useSousChefV2")
  return useMemo(() => getSouschefV2Contract(chainId, id, library.getSigner()), [chainId, id, library])
}

export const usePointCenterIfoContract = () => {
  const { library, chainId } = useActiveWeb3React("usePointCenterIfoContract")
  return useMemo(() => getPointCenterIfoContract(chainId, library.getSigner()), [chainId, library])
}

export const useClaimRefundContract = () => {
  const { library, chainId } = useActiveWeb3React("useClaimRefundContract")
  return useMemo(() => getClaimRefundContract(chainId, library.getSigner()), [chainId, library])
}

export const useCakeVaultContract = () => {
  const { library, chainId } = useActiveWeb3React("useCakeVaultContract")
  return useMemo(() => getCakeVaultContract(chainId, library.getSigner()), [chainId, library])
}

export const usePredictionsContract = () => {
  const { library, chainId } = useActiveWeb3React("usePredictionsContract")
  return useMemo(() => getPredictionsContract(chainId, library.getSigner()), [chainId, library])
}

export const useChainlinkOracleContract = () => {
  const { library, chainId } = useActiveWeb3React("useChainlinkOracleContract")
  return useMemo(() => getChainlinkOracleContract(chainId, library.getSigner()), [chainId, library])
}

export const useFarmAuctionContract = () => {
  const { account, library, chainId } = useActiveWeb3React("useFarmAuctionContract")
  // This hook is slightly different from others
  // Calls were failing if unconnected user goes to farm auction page
  // Using library instead of library.getSigner() fixes the problem for unconnected users
  // However, this fix is not ideal, it currently has following behavior:
  // - If you visit Farm Auction page coming from some other page there are no errors in console (unconnected or connected)
  // - If you go directly to Farm Auction page
  //   - as unconnected user you don't see any console errors
  //   - as connected user you see `unknown account #0 (operation="getAddress", code=UNSUPPORTED_OPERATION, ...` errors
  //     the functionality of the page is not affected, data is loading fine and you can interact with the contract
  //
  // Similar behavior was also noticed on Trading Competition page.
  return useMemo(
    () => getFarmAuctionContract(chainId, account ? library.getSigner() : library),
    [chainId, library, account],
  )
}

// Code below migrated from Exchange useContract.ts

// returns null on errors
function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
  const { library, account } = useActiveWeb3React("useContract")

  return useMemo(() => {
    if (!address || !ABI || !library) return null
    try {
      return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
    } catch (error: any) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, library, withSignerIfPossible, account])
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible)
}

export function useWETHContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React("useWETHContract")
  return useContract(chainId ? WRAPPED_NETWORK_TOKENS[chainId].address : undefined, WAVAX_ABI, withSignerIfPossible)
}

export function useENSRegistrarContract(withSignerIfPossible?: boolean): Contract | null {
  console.log("useENSRegistrarContract")
  const { chainId } = useNetworkState()
  let address: string | undefined
  if (chainId) {
    // eslint-disable-next-line default-case
    switch (chainId) {
      case ChainId.BSC_MAINNET:
      case ChainId.BSC_TESTNET:
        address = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
        break
    }
  }
  return useContract(address, ENS_ABI, withSignerIfPossible)
}

export function useENSResolverContract(address: string | undefined, withSignerIfPossible?: boolean): Contract | null {
  console.log("useENSResolverContract")
  return useContract(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  console.log("useBytes32TokenContract")
  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  console.log("usePairContract")
  return useContract(pairAddress, IUniswapV2PairABI, withSignerIfPossible)
}

export function useMulticallContract(): Contract | null {
  const { chainId } = useNetworkState()
  console.log("useMulticallContract")
  return useContract(getMulticallAddress(chainId), multiCallAbi, false)
}

export function useStableLPContract(stableLpAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  console.log("useStableLPContract")
  return useContract(stableLpAddress, stableLp_AVAX, withSignerIfPossible)
}
