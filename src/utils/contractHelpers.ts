import { ethers } from 'ethers'
import { simpleRpcProvider } from 'utils/providers'
import { poolsConfig } from 'config/constants'
import { PoolCategory } from 'config/constants/types'

// Addresses
import {
  getAddress,
  getPancakeProfileAddress,
  getPancakeRabbitsAddress,
 // getBunnyFactoryAddress,
 // getBunnySpecialAddress,
  getCakeAddress,
  getLotteryV2Address,
  getMasterChefAddress,
  getPointCenterIfoAddress,
  getClaimRefundAddress,
//  getTradingCompetitionAddress,
//  getEasterNftAddress,
  getCakeVaultAddress,
  getPredictionsAddress,
  getChainlinkOracleAddress,
  getMulticallAddress,
//  getBunnySpecialCakeVaultAddress,
//  getBunnySpecialPredictionAddress,
//  getBunnySpecialLotteryAddress,
  getFarmAuctionAddress,
} from 'utils/addressHelpers'

// ABI
import profileABI from 'config/abi/pancakeProfile.json'
import pancakeRabbitsAbi from 'config/abi/pancakeRabbits.json'
// import bunnyFactoryAbi from 'config/abi/bunnyFactory.json'
// import bunnySpecialAbi from 'config/abi/bunnySpecial.json'
import bep20Abi from 'config/abi/erc20.json'
import erc721Abi from 'config/abi/erc721.json'
import lpTokenAbi from 'config/abi/lpToken.json'
import cakeAbi from 'config/abi/cake.json'
// import ifoV1Abi from 'config/abi/ifoV1.json'
import ifoV2Abi from 'config/abi/ifoV2.json'
import pointCenterIfo from 'config/abi/pointCenterIfo.json'
import lotteryV2Abi from 'config/abi/lotteryV2.json'
import masterChef from 'config/abi/masterchef.json'
import sousChef from 'config/abi/sousChef.json'
import sousChefV2 from 'config/abi/sousChefV2.json'
import sousChefBnb from 'config/abi/sousChefBnb.json'
import claimRefundAbi from 'config/abi/claimRefund.json'
// import tradingCompetitionAbi from 'config/abi/tradingCompetition.json'
// import easterNftAbi from 'config/abi/easterNft.json'
import cakeVaultAbi from 'config/abi/cakeVault.json'
import predictionsAbi from 'config/abi/predictions.json'
import chainlinkOracleAbi from 'config/abi/chainlinkOracle.json'
import MultiCallAbi from 'config/abi/Multicall.json'
// import bunnySpecialCakeVaultAbi from 'config/abi/bunnySpecialCakeVault.json'
// import bunnySpecialPredictionAbi from 'config/abi/bunnySpecialPrediction.json'
// import bunnySpecialLotteryAbi from 'config/abi/bunnySpecialLottery.json'
import farmAuctionAbi from 'config/abi/farmAuction.json'
import { ChainLinkOracleContract, FarmAuctionContract, PredictionsContract } from './types'

const getContract = (
  chainId: number,
  abi: any,
  address: string,
  signer?: ethers.Signer | ethers.providers.Provider,
) => {
  const signerOrProvider = signer ?? simpleRpcProvider(chainId)
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
// export const getIfoV1Contract = (address: string, signer?: ethers.Signer | ethers.providers.Provider) => {
//   return getContract(ifoV1Abi, address, signer)
// }
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
export const getProfileContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, profileABI, getPancakeProfileAddress(chainId), signer)
}
export const getPancakeRabbitContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, pancakeRabbitsAbi, getPancakeRabbitsAddress(chainId), signer)
}
// export const getBunnyFactoryContract = (signer?: ethers.Signer | ethers.providers.Provider) => {
//   return getContract(bunnyFactoryAbi, getBunnyFactoryAddress(), signer)
// }
// export const getBunnySpecialContract = (signer?: ethers.Signer | ethers.providers.Provider) => {
//   return getContract(bunnySpecialAbi, getBunnySpecialAddress(), signer)
// }
export const getLotteryV2Contract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, lotteryV2Abi, getLotteryV2Address(chainId), signer)
}
export const getMasterchefContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, masterChef, getMasterChefAddress(chainId), signer)
}
export const getClaimRefundContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, claimRefundAbi, getClaimRefundAddress(chainId), signer)
}
// export const getTradingCompetitionContract = (signer?: ethers.Signer | ethers.providers.Provider) => {
//   return getContract(tradingCompetitionAbi, getTradingCompetitionAddress(), signer)
// }
// export const getEasterNftContract = (signer?: ethers.Signer | ethers.providers.Provider) => {
//   return getContract(easterNftAbi, getEasterNftAddress(), signer)
// }
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
// export const getBunnySpecialCakeVaultContract = (signer?: ethers.Signer | ethers.providers.Provider) => {
//   return getContract(bunnySpecialCakeVaultAbi, getBunnySpecialCakeVaultAddress(), signer)
// }
// export const getBunnySpecialPredictionContract = (signer?: ethers.Signer | ethers.providers.Provider) => {
//   return getContract(bunnySpecialPredictionAbi, getBunnySpecialPredictionAddress(), signer)
// }
// export const getBunnySpecialLotteryContract = (signer?: ethers.Signer | ethers.providers.Provider) => {
//   return getContract(bunnySpecialLotteryAbi, getBunnySpecialLotteryAddress(), signer)
// }
export const getFarmAuctionContract = (chainId: number, signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(chainId, farmAuctionAbi, getFarmAuctionAddress(chainId), signer) as FarmAuctionContract
}
