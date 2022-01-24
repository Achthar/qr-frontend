import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { DEFAULT_GAS_LIMIT, DEFAULT_TOKEN_DECIMAL } from 'config'
import getGasPrice from 'utils/getGasPrice'
import { getAddress } from 'ethers/lib/utils'

const options = {
  gasLimit: DEFAULT_GAS_LIMIT,
}

export const stakeBond = async (masterChefContract, pid, amount) => {
  const gasPrice = getGasPrice(56)
  const value = new BigNumber(amount).times(DEFAULT_TOKEN_DECIMAL).toString()
  if (pid === 0) {
    const tx = await masterChefContract.enterStaking(value, { ...options, gasPrice })
    const receipt = await tx.wait()
    return receipt.status
  }

  const tx = await masterChefContract.deposit(pid, value, { ...options, gasPrice })
  const receipt = await tx.wait()
  return receipt.status
}

export const unstakeBond = async (masterChefContract, pid, amount) => {
  const gasPrice = getGasPrice(56)
  const value = new BigNumber(amount).times(DEFAULT_TOKEN_DECIMAL).toString()
  if (pid === 0) {
    const tx = await masterChefContract.leaveStaking(value, { ...options, gasPrice })
    const receipt = await tx.wait()
    return receipt.status
  }

  const tx = await masterChefContract.withdraw(pid, value, { ...options, gasPrice })
  const receipt = await tx.wait()
  return receipt.status
}

export const harvestBond = async (masterChefContract, pid) => {
  const gasPrice = getGasPrice(56)
  if (pid === 0) {
    const tx = await masterChefContract.leaveStaking('0', { ...options, gasPrice })
    const receipt = await tx.wait()
    return receipt.status
  }

  const tx = await masterChefContract.deposit(pid, '0', { ...options, gasPrice })
  const receipt = await tx.wait()
  return receipt.status
}


export const redeemBond = async (chainId, account, bondDepositoryContract, bondId) => {
  const gasPrice = getGasPrice(chainId)
  const tx = await bondDepositoryContract.redeem(account, false, { ...options, gasPrice })
  const receipt = await tx.wait()
  return receipt.status
}

export const startBonding = async (chainId, account, bondDepositoryContract, bondId, amount, maxPrice) => {
  const gasPrice = getGasPrice(chainId)
  const value = new BigNumber(amount).times(DEFAULT_TOKEN_DECIMAL).toString()
  const max = new BigNumber(maxPrice).times(DEFAULT_TOKEN_DECIMAL).toString()
  console.log("ARGS", value, max, account)
  const tx = await bondDepositoryContract.deposit(value, max, getAddress(account), { gasPrice }) // no gas limit, otherwise issues
  const receipt = await tx.wait()
  return receipt.status
}
