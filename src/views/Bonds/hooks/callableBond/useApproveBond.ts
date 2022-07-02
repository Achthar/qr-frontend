import { useCallback } from 'react'
import { ethers, Contract } from 'ethers'
import { useCallWithGasPrice } from 'hooks/useCallWithGasPrice'
import { getCallableBondingDepositoryAddress } from 'utils/addressHelpers'

const useApproveBond = (chainId: number, lpContract: Contract) => {
  const bondContractAddress = getCallableBondingDepositoryAddress(chainId)
  const { callWithGasPrice } = useCallWithGasPrice()
  const handleApprove = useCallback(async () => {
    try {
      const tx = await callWithGasPrice(lpContract, 'approve', [
        bondContractAddress,
        ethers.constants.MaxUint256,
      ])
      const receipt = await tx.wait()
      return receipt.status
    } catch (e) {
      return false
    }
  }, [lpContract, bondContractAddress, callWithGasPrice])

  return { onApprove: handleApprove }
}

export default useApproveBond
