import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { DEFAULT_GAS_LIMIT, DEFAULT_TOKEN_DECIMAL } from 'config'
import getGasPrice from 'utils/getGasPrice'
import { getAddress } from 'ethers/lib/utils'

const options = {
  gasLimit: DEFAULT_GAS_LIMIT,
}


export const redeemCallableNote = async (chainId, account, bondDepositoryContract, noteIndex) => {
  const gasPrice = getGasPrice(chainId)
  const tx = await bondDepositoryContract.call(
    account, // user
    [noteIndex], // indexes
    // { ...options, gasPrice }
  )
  const receipt = await tx.wait()
  return receipt.status
}

export const redeemCallablePositions = async (chainId, account, bondDepositoryContract, noteIndexes) => {
  const gasPrice = getGasPrice(chainId)
  const tx = await bondDepositoryContract.call(
    account, // user
    noteIndexes, // indexes
    // { ...options, gasPrice }
  )
  const receipt = await tx.wait()
  return receipt.status
}

export const startCallableBonding = async (chainId, account, bondDepositoryContract, bondId, amount, maxPrice) => {
  const gasPrice = getGasPrice(chainId)
  const value = new BigNumber(amount).times(DEFAULT_TOKEN_DECIMAL).toString()
  const max = new BigNumber(maxPrice).times(DEFAULT_TOKEN_DECIMAL).toString()
  const tx = await bondDepositoryContract.deposit(
    bondId, // id
    value, // amount
    max, // max price
    getAddress(account), // user
    getAddress(account), // referral
    // { ...options, gasPrice }
  ) // no gas limit, otherwise issues
  const receipt = await tx.wait()
  return receipt.status
}


export const claimCallableReward = async (chainId, bondDepositoryContract) => {
  const gasPrice = getGasPrice(chainId)
  const tx = await bondDepositoryContract.getReward(
    // { ...options, gasPrice }
  )
  const receipt = await tx.wait()
  return receipt.status
}