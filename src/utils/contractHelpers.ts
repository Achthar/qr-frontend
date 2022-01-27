import { ethers } from 'ethers'
import { Interface } from '@ethersproject/abi'
import { simpleRpcProvider } from 'utils/providers'
import { poolsConfig } from 'config/constants'
import { BondConfig, PoolCategory } from 'config/constants/types'

// Addresses
import {
  getAddress,
  getPancakeRabbitsAddress,
  getCakeAddress,
  getLotteryV2Address,
  getMasterChefAddress,
  getPointCenterIfoAddress,
  getClaimRefundAddress,
  getCakeVaultAddress,
  getPredictionsAddress,
  getChainlinkOracleAddress,
  getMulticallAddress,
  getFarmAuctionAddress,
  getRequiemAddress,
  getStableSwapAddress,
  getStableLpAddress,
  getAddressForReserve,
  getAddressForBondingCalculator,
  getAddressForBond,
  getAddressForWeightedPairFactory,
  getAddressForLpReserve
} from 'utils/addressHelpers'

// ABI base
import bep20Abi from 'config/abi/erc20.json'
import erc721Abi from 'config/abi/erc721.json'
import lpTokenAbi from 'config/abi/lpToken.json'
import cakeAbi from 'config/abi/cake.json'
import ifoV2Abi from 'config/abi/ifoV2.json'
import pointCenterIfo from 'config/abi/pointCenterIfo.json'
import lotteryV2Abi from 'config/abi/lotteryV2.json'
import masterChef from 'config/abi/masterchef.json'
import requiemChef from 'config/abi/avax/RequiemChef.json'
import sousChef from 'config/abi/sousChef.json'
import sousChefV2 from 'config/abi/sousChefV2.json'
import sousChefBnb from 'config/abi/sousChefBnb.json'
import claimRefundAbi from 'config/abi/claimRefund.json'
import cakeVaultAbi from 'config/abi/cakeVault.json'
import predictionsAbi from 'config/abi/predictions.json'
import chainlinkOracleAbi from 'config/abi/chainlinkOracle.json'
import MultiCallAbi from 'config/abi/Multicall.json'
import farmAuctionAbi from 'config/abi/farmAuction.json'

import weightedFactoryAVAX from 'config/abi/avax/RequiemWeightedPairFactory.json'
import weightedPairAVAX from 'config/abi/avax/RequiemWeightedPair.json'

import weightedFactoryOASIS from 'config/abi/oasis/RequiemWeightedPairFactory.json'

import bondReserveAVAX from 'config/abi/avax/RequiemQBondDepository.json'
import bondingCalculatorAVAX from 'config/abi/avax/RequiemQBondingCalculator.json'

// ABI polygon
import lpTokenAbiPolygon from 'config/abi/polygon/IRequiemPair.json'

// ABI AVAX
import stableSwapAVAX from 'config/abi/avax/RequiemStableSwap.json'
import IERC20 from 'config/abi/avax/IERC20.json'

import { ChainLinkOracleContract, FarmAuctionContract, PredictionsContract, StableSwapContract, StableLpContract } from './types'




const getContract = (
  chainId: number,
  abi: any,
  address: string,
  signer?: ethers.Signer | ethers.providers.Provider,
) => {
  const signerOrProvider = signer ?? simpleRpcProvider(chainId, `getContract, ${address}!`)
  return new ethers.Contract(address, abi, signerOrProvider)
}

export const getBep20Contract = (
  chainId: number,
  address: string,
  signer?: ethers.Signer | ethers.providers.Provider,
) => {
  return getContract(chainId, bep20Abi, address, signer)
}
export const getErc721Contract = (
  chainId: number,
  address: string,
  signer?: ethers.Signer | ethers.providers.Provider,
) => {
  return getContract(chainId, erc721Abi, address, signer)
}

export const getLpContract = (chainId: number, address: string, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, lpTokenAbi, address, signer)
}

export const getIfoV2Contract = (
  chainId: number,
  address: string,
  signer?: ethers.Signer | ethers.providers.Provider,
) => {
  return getContract(chainId, ifoV2Abi, address, signer)
}
export const getSouschefContract = (
  chainId: number,
  id: number,
  signer?: ethers.Signer | ethers.providers.Provider,
) => {
  const config = poolsConfig.find((pool) => pool.sousId === id)
  const abi = config.poolCategory === PoolCategory.BINANCE ? sousChefBnb : sousChef
  return getContract(chainId, abi, getAddress(chainId, config.contractAddress), signer)
}
export const getSouschefV2Contract = (
  chainId: number,
  id: number,
  signer?: ethers.Signer | ethers.providers.Provider,
) => {
  const config = poolsConfig.find((pool) => pool.sousId === id)
  return getContract(chainId, sousChefV2, getAddress(chainId, config.contractAddress), signer)
}
export const getPointCenterIfoContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, pointCenterIfo, getPointCenterIfoAddress(chainId), signer)
}
export const getCakeContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, cakeAbi, getCakeAddress(chainId), signer)
}

export const getRequiemContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, cakeAbi, getRequiemAddress(chainId), signer)
}

export const getLotteryV2Contract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, lotteryV2Abi, getLotteryV2Address(chainId), signer)
}
export const getMasterchefContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, chainId === 43113 ? new Interface(requiemChef) : masterChef, getMasterChefAddress(chainId), signer)
}
export const getClaimRefundContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, claimRefundAbi, getClaimRefundAddress(chainId), signer)
}
export const getCakeVaultContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, cakeVaultAbi, getCakeVaultAddress(chainId), signer)
}

export const getPredictionsContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, predictionsAbi, getPredictionsAddress(chainId), signer) as PredictionsContract
}

export const getChainlinkOracleContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, chainlinkOracleAbi, getChainlinkOracleAddress(chainId), signer) as ChainLinkOracleContract
}
export const getMulticallContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, MultiCallAbi, getMulticallAddress(chainId), signer)
}
export const getFarmAuctionContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, farmAuctionAbi, getFarmAuctionAddress(chainId), signer) as FarmAuctionContract
}
export const getStableSwapContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, new Interface(stableSwapAVAX), getStableSwapAddress(chainId), signer) as StableSwapContract
  // return getContract(chainId, stableSwapAVAX, getStableSwapAddress(chainId), signer) as StableSwapContract
}
export const getStableLpContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, new Interface(IERC20), getStableLpAddress(chainId), signer) as StableLpContract
  // return getContract(chainId, IERC20, getStableLpAddress(chainId), signer) as StableLpContract
}

export const getContractForReserve = (chainId: number, bondConfig: BondConfig, signer?: ethers.Signer | ethers.providers.Provider) => {
  const bondAddress = getAddressForReserve(chainId, bondConfig) || "";
  const ABI = new Interface(weightedPairAVAX)
  return new ethers.Contract(bondAddress, ABI, signer);
}

export const getContractForLpReserve = (chainId: number, bondConfig: BondConfig, signer?: ethers.Signer | ethers.providers.Provider) => {
  const bondAddress = getAddressForLpReserve(chainId, bondConfig) || "";
  const ABI = new Interface(weightedPairAVAX)
  return new ethers.Contract(bondAddress, ABI, signer);
}

export const getWeightedPairContract = (address: string, signer?: ethers.Signer | ethers.providers.Provider) => {
  // const bondAddress = getAddressForReserve(chainId) || "";
  const ABI = new Interface(weightedPairAVAX)
  return new ethers.Contract(address, ABI, signer);
}

export const getWeightedPairFactory = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  const factoryAddress = getAddressForWeightedPairFactory(chainId) || "";
  const ABI = new Interface(chainId === 43113 ? weightedFactoryAVAX : weightedFactoryOASIS)
  return new ethers.Contract(factoryAddress, ABI, signer);
}

export const getContractForBond = (chainId: number, bondConfig: BondConfig, signer?: ethers.Signer | ethers.providers.Provider) => {
  const bondAddress = getAddressForBond(chainId, bondConfig) || "";
  const ABI = new Interface(bondReserveAVAX)
  return new ethers.Contract(bondAddress, ABI, signer);
}

export const getBondCalculatorContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  const BondCalcContractABI = new Interface(bondingCalculatorAVAX)
  const bondingCalculatorAddress = getAddressForBondingCalculator(chainId) || "";
  return new ethers.Contract(
    bondingCalculatorAddress,
    BondCalcContractABI,
    signer,
  )
};

export const getBondingDepositoryContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, chainId === 43113 ? new Interface(bondReserveAVAX) : bondReserveAVAX, getBondingDepositoryContract(chainId), signer)
}