import BigNumber from 'bignumber.js'
import { DEFAULT_GAS_LIMIT, DEFAULT_TOKEN_DECIMAL } from 'config'
import getGasPrice from 'utils/getGasPrice'

const options = {
  gasLimit: DEFAULT_GAS_LIMIT,
}


export const withdrawFromLock = async (chainId, redReqContract, lock) => {
  const gasPrice = getGasPrice(chainId)

  const tx = await redReqContract.withdraw(lock.end, lock.amount, { ...options, gasPrice })
  const receipt = await tx.wait()
  return receipt.status
}

export const emergencyWithdrawFromLock = async (chainId, redReqContract, lock) => {
    const gasPrice = getGasPrice(chainId)
  
    const tx = await redReqContract.emergencyWithdraw(lock.end, { ...options, gasPrice })
    const receipt = await tx.wait()
    return receipt.status
  }
  
