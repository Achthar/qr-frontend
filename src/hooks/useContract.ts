
/* eslint-disable camelcase */
import { useMemo } from 'react'

import useActiveWeb3React from 'hooks/useActiveWeb3React'

import {
  getERC20Contract,
  getCakeContract,
  getMasterchefContract,
  getPointCenterIfoContract,
  getClaimRefundContract,
  getErc721Contract,
  getCakeVaultContract,
  getPredictionsContract,
  getChainlinkOracleContract,
  getFarmAuctionContract,
  getBondingDepositoryContract,
  getRedRequiemContract,
  getRedRequiemStakingContract,
  getAssetBackedStakingContract,
} from 'utils/contractHelpers'


import { Interface } from '@ethersproject/abi'
import { Web3Provider } from '@ethersproject/providers'
import { getBondingDepositoryAddress, getCallableBondingDepositoryAddress, getCallBondingDepositoryAddress, getMulticallAddress } from 'utils/addressHelpers'
// import { useNetworkState } from 'state/globalNetwork/hooks'
import { REQUIEM_WEIGHTED_FORMULA_ADDRESS } from 'config/constants'
// Imports below migrated from Exchange useContract.ts
import { Contract } from '@ethersproject/contracts'
import { WRAPPED_NETWORK_TOKENS, WEIGHTED_FACTORY_ADDRESS } from '@requiemswap/sdk'
import { BondConfig } from 'config/constants/types'


// abis
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import ENS_PUBLIC_RESOLVER_ABI from '../config/abi/ens-public-resolver.json'
import ENS_ABI from '../config/abi/ens-registrar.json'
import { ERC20_BYTES32_ABI } from '../config/abi/erc20'
import ERC20_ABI from '../config/abi/erc20.json'
import WETH_ABI from '../config/abi/weth.json'
import WAVAX_ABI from '../config/abi/avax/wavax.json'
import WEIGHTED_FORMULA_ABI from '../config/abi/avax/RequiemFormula.json'

import BOND_DEPO_AVAX from '../config/abi/avax/BondDepository.json'
import CALL_BOND_DEPO_AVAX from '../config/abi/avax/CallBondDepository.json'
import CALLABLE_BOND_DEPO_AVAX from '../config/abi/avax/CallableBondDepository.json'
import multiCallAbi from '../config/abi/Multicall.json'
import multiCallAbi_AVAX from '../config/abi/avax/Multicall.json'
import multiCallAbi_QKC from '../config/abi/qkc/Multicall.json'
import multiCallAbi_OASIS from '../config/abi/oasis/Multicall.json'
import stableLp_AVAX from '../config/abi/avax/IERC20.json'
import weightedFactoryABI from '../config/abi/avax/RequiemWeightedPairFactory.json'
import { getContract } from '../utils'
import { ChainId } from '../config/index'


/**
 * Helper hooks to get specific contracts (by ABI)
 */

export const useERC20 = (address: string) => {
  const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getERC20Contract(chainId, address, library.getSigner()), [chainId, address, library])
}

/**
 * @see https://docs.openzeppelin.com/contracts/3.x/api/token/erc721
 */
export const useERC721 = (address: string) => {
  const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getErc721Contract(chainId, address, library.getSigner()), [chainId, address, library])
}

export const useCake = () => {
  const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getCakeContract(chainId, library.getSigner()), [chainId, library])
}

export const useMasterchef = () => {
  const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getMasterchefContract(chainId, library.getSigner()), [chainId, library])
}

export const usePointCenterIfoContract = () => {
  const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getPointCenterIfoContract(chainId, library.getSigner()), [chainId, library])
}

export const useClaimRefundContract = () => {
  const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getClaimRefundContract(chainId, library.getSigner()), [chainId, library])
}

export const useCakeVaultContract = () => {
  const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getCakeVaultContract(chainId, library.getSigner()), [chainId, library])
}

export const usePredictionsContract = () => {
  const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getPredictionsContract(chainId, library.getSigner()), [chainId, library])
}

export const useChainlinkOracleContract = () => {
  const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getChainlinkOracleContract(chainId, library.getSigner()), [chainId, library])
}

export const useFarmAuctionContract = () => {
  const { account, library, chainId } = useActiveWeb3React()
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
  const { library, account } = useActiveWeb3React()
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

function useContractWithAccount(account: string, library: Web3Provider, address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
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
  const { chainId } = useActiveWeb3React()
  return useContract(chainId ? WRAPPED_NETWORK_TOKENS[chainId].address : undefined, WAVAX_ABI, withSignerIfPossible)
}

export function useENSRegistrarContract(chainId: number, withSignerIfPossible?: boolean): Contract | null {

  // const { chainId } = useNetworkState()
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

  return useContract(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {

  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {

  return useContract(pairAddress, IUniswapV2PairABI, withSignerIfPossible)
}

export function useMulticallContract(chainId: number): Contract | null {
  // const { chainId } = useNetworkState()

  return useContract(getMulticallAddress(chainId), chainId === 110001 ? multiCallAbi_QKC : multiCallAbi, false)
}

export function useStableLPContract(stableLpAddress?: string, withSignerIfPossible?: boolean): Contract | null {

  return useContract(stableLpAddress, stableLp_AVAX, withSignerIfPossible)
}

export function useWeightedFactoryContract(chainId: number): Contract | null {
  return useContract(chainId ? WEIGHTED_FACTORY_ADDRESS[chainId] : undefined, new Interface(weightedFactoryABI), false)
}

export function useWeightedFormulaContract(chainId: number): Contract | null {
  return useContract(chainId ? REQUIEM_WEIGHTED_FORMULA_ADDRESS[chainId] : undefined, new Interface(WEIGHTED_FORMULA_ABI), false)
}


export function useBondContract(chainId: number, withSignerIfPossible?: boolean): Contract | null {
  return useContract(chainId ? getBondingDepositoryAddress(chainId) : undefined, new Interface(BOND_DEPO_AVAX), withSignerIfPossible)
}

export function useCallBondContract(chainId: number, withSignerIfPossible?: boolean): Contract | null {
  return useContract(chainId ? getCallBondingDepositoryAddress(chainId) : undefined, new Interface(CALL_BOND_DEPO_AVAX), withSignerIfPossible)
}

export function useCallableBondContract(chainId: number, withSignerIfPossible?: boolean): Contract | null {
  return useContract(chainId ? getCallableBondingDepositoryAddress(chainId) : undefined, new Interface(CALLABLE_BOND_DEPO_AVAX), withSignerIfPossible)
}

export const useRequiemChef = (chainId, library) => {
  // const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getMasterchefContract(chainId, library.getSigner()), [chainId, library])
}

export function useBondDepositoryContract(chainId: number, library): Contract | null {
  return useMemo(() => getBondingDepositoryContract(chainId, library.getSigner()), [chainId, library])
}

export const useRedRequiemContract = () => {
  const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getRedRequiemContract(chainId, library.getSigner()), [chainId, library])
}

export const useRedRequiemStakingContract = () => {
  const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getRedRequiemStakingContract(chainId, library.getSigner()), [chainId, library])
}

export const useAssetBackedStakingContract = () => {
  const { library, chainId } = useActiveWeb3React()
  return useMemo(() => getAssetBackedStakingContract(chainId, library.getSigner()), [chainId, library])
}