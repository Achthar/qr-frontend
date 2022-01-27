import { useCallback } from 'react'
import { ethers, Contract } from 'ethers'
import { useBondContract } from 'hooks/useContract'
import { useCallWithGasPrice } from 'hooks/useCallWithGasPrice'
import { getAddressForBond } from 'utils/addressHelpers'
import { BondConfig } from 'config/constants/types'

const useApproveBond = (chainId: number, lpContract: Contract, bond: BondConfig) => {
  const bondContractAddress = getAddressForBond(chainId, bond)
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
