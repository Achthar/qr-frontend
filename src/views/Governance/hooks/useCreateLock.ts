import { useCallback } from 'react'
import { ethers, Contract } from 'ethers'
import { useMasterchef, useRedRequiemContract } from 'hooks/useContract'
import { useCallWithGasPrice } from 'hooks/useCallWithGasPrice'

const useCreateLock = (lpContract: Contract) => {
  const redRequiemContract = useRedRequiemContract()
  const { callWithGasPrice } = useCallWithGasPrice()
  const handleApprove = useCallback(async (amount:string, time:string) => {
    try {
      const tx = await callWithGasPrice(lpContract, 'create_lock', [
        redRequiemContract.address,
        ethers.constants.MaxUint256,
      ])
      const receipt = await tx.wait()
      return receipt.status
    } catch (e) {
      return false
    }
  }, [lpContract, redRequiemContract, callWithGasPrice])

  return { onApprove: handleApprove }
}

export default useCreateLock
