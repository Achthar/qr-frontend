import { WRAPPED_NETWORK_TOKENS } from '@requiemswap/sdk'
import { addresses } from 'config/constants/contracts'
import tokens from 'config/constants/tokens'
import { Address, BondConfig } from 'config/constants/types'
import { ethers } from 'ethers'


export const getAddress = (chainId: number, address: Address): string => {
  // const chainId = process.env.REACT_APP_CHAIN_ID
  return address[chainId ?? 43113] ? address[chainId ?? 43113] : address[process.env.REACT_APP_CHAIN_ID ?? 43113]
}

export const getCakeAddress = (chainId: number) => {
  return getAddress(chainId, tokens.cake.address)
}
export const getRequiemAddress = (chainId: number) => {
  return getAddress(chainId, tokens.reqt.address)
}
export const getMasterChefAddress = (chainId: number) => {
  return getAddress(chainId, addresses.masterChef)
}
export const getRedRequiemAddress = (chainId: number) => {
  return getAddress(chainId, addresses.bloodRedRequiem)
}
export const getRedRequiemStakingAddress = (chainId: number) => {
  return getAddress(chainId, addresses.redRequiemStaking)
}
export const getMulticallAddress = (chainId: number) => {
  return getAddress(chainId, addresses.multiCall)
}
export const getWNetworkCcyAddress = (chainId: number) => {
  return ethers.utils.getAddress(WRAPPED_NETWORK_TOKENS[chainId].address)
}
export const getClaimRefundAddress = (chainId: number) => {
  return getAddress(chainId, addresses.claimRefund)
}
export const getPointCenterIfoAddress = (chainId: number) => {
  return getAddress(chainId, addresses.pointCenterIfo)
}
export const getBunnySpecialAddress = (chainId: number) => {
  return getAddress(chainId, addresses.bunnySpecial)
}
export const getTradingCompetitionAddress = (chainId: number) => {
  return getAddress(chainId, addresses.tradingCompetition)
}
export const getEasterNftAddress = (chainId: number) => {
  return getAddress(chainId, addresses.easterNft)
}
export const getCakeVaultAddress = (chainId: number) => {
  return getAddress(chainId, addresses.cakeVault)
}
export const getPredictionsAddress = (chainId: number) => {
  return getAddress(chainId, addresses.predictions)
}
export const getChainlinkOracleAddress = (chainId: number) => {
  return getAddress(chainId, addresses.chainlinkOracle)
}
export const getBunnySpecialCakeVaultAddress = (chainId: number) => {
  return getAddress(chainId, addresses.bunnySpecialCakeVault)
}
export const getBunnySpecialPredictionAddress = (chainId: number) => {
  return getAddress(chainId, addresses.bunnySpecialPrediction)
}
export const getBunnySpecialLotteryAddress = (chainId: number) => {
  return getAddress(chainId, addresses.bunnySpecialLottery)
}
export const getFarmAuctionAddress = (chainId: number) => {
  return getAddress(chainId, addresses.farmAuction)
}
export const getStableSwapAddress = (chainId: number) => {
  return getAddress(chainId, addresses.stableSwap)
}

export const getAddressForReserve = (chainId: number, bondConfig: BondConfig) => {
  return getAddress(chainId, bondConfig.reserveAddress)
}

export const getAddressForLpReserve = (chainId: number, bondConfig: BondConfig) => {
  return getAddress(chainId, bondConfig.reserveAddress)
}

export const getAddressForBondingCalculator = (chainId: number) => {
  return getAddress(chainId, addresses.weightedBondingCalculator);
}

export const getAddressForWeightedPairFactory = (chainId: number) => {
  return getAddress(chainId, addresses.weightedPairFactory);
}

export const getBondingDepositoryAddress = (chainId: number) => {
  return getAddress(chainId, addresses.bondDepository)
}

export const getCallBondingDepositoryAddress = (chainId: number) => {
  return getAddress(chainId, addresses.callBondDepository)
}

export const getCallableBondingDepositoryAddress = (chainId: number) => {
  return getAddress(chainId, addresses.callableBondDepository)
}

export const getAssetBackedStakingAddress = (chainId: number) => {
  return getAddress(chainId, addresses.staking)
}

export const getStakedRequiemAddress = (chainId: number) => {
  return getAddress(chainId, addresses.sREQ)
}

export const getGovernanceRequiemAddress = (chainId: number) => {
  return getAddress(chainId, addresses.gREQ)
}