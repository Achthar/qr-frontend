import { useCallback } from 'react'
import { ethers, Contract } from 'ethers'
import { useBondContract } from 'hooks/useContract'
import { useCallWithGasPrice } from 'hooks/useCallWithGasPrice'

const useApproveBond = (chainId: number, lpContract: Contract) => {
  const bondContract = useBondContract(chainId)
  const { callWithGasPrice } = useCallWithGasPrice()
  const handleApprove = useCallback(async () => {
    try {
      const tx = await callWithGasPrice(lpContract, 'approve', [
        bondContract.address,
        ethers.constants.MaxUint256,
      ])
      const receipt = await tx.wait()
      return receipt.status
    } catch (e) {
      return false
    }
  }, [lpContract, bondContract, callWithGasPrice])

  return { onApprove: handleApprove }
}

export default useApproveBond
