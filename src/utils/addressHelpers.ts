import { ChainId } from '@requiemswap/sdk'
import { addresses } from 'config/constants/contracts'
import tokens from 'config/constants/tokens'
import { Address } from 'config/constants/types'


export const getAddress = (chainId: number, address: Address): string => {
  // const chainId = process.env.REACT_APP_CHAIN_ID
  return address[chainId] ? address[chainId] : address[process.env.REACT_APP_CHAIN_ID]
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
export const getMulticallAddress = (chainId: number) => {
  return getAddress(chainId, addresses.multiCall)
}
export const getWbnbAddress = (chainId: number) => {
  return getAddress(chainId, tokens.wavax.address)
}
export const getLotteryV2Address = (chainId: number) => {
  return getAddress(chainId, addresses.lotteryV2)
}
export const getPancakeProfileAddress = (chainId: number) => {
  return getAddress(chainId, addresses.pancakeProfile)
}
export const getPancakeRabbitsAddress = (chainId: number) => {
  return getAddress(chainId, addresses.pancakeRabbits)
}
export const getBunnyFactoryAddress = (chainId: number) => {
  return getAddress(chainId, addresses.bunnyFactory)
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

export const getStableLpAddress = (chainId: number) => {
  return getAddress(chainId, addresses.stableLp)
}

export const getAddressForBond = (chainId: number) => {
  return getAddress(chainId, addresses.bondDepositoty);
}

export const getAddressForReserve = (chainId: number) => {
  return getAddress(chainId, addresses.reserve)
}

export const getAddressForLpReserve = (chainId: number) => {
  return getAddress(chainId, addresses.reserveLp)
}

export const getAddressForBondingCalculator = (chainId: number) => {
  return getAddress(chainId, addresses.weightedBondingCalculator);
}

export const getAddressForWeightedPairFactory = (chainId: number) => {
  return getAddress(chainId, addresses.weightedPairFactory);
}
