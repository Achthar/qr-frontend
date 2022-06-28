import { useCallback } from 'react'
import {  startCallBonding } from 'utils/calls'
import { getContractForCallableBondDepo } from 'utils/contractHelpers'
import { BondConfig } from 'config/constants/types'

const useDepositBond = (chainId: number, account: string, library: any, bond: BondConfig) => {
  const bondDepositoryContract = getContractForCallableBondDepo(chainId, account ? library.getSigner() : library)

  const handleBonding = useCallback(
    async (amount: string, maxPrice: string) => {
      const txHash = await startCallBonding(chainId, account, bondDepositoryContract, bond.bondId, amount, maxPrice)
      console.info(txHash)
    },
    [bondDepositoryContract, bond.bondId, account, chainId],
  )

  return { onBonding: handleBonding }
}

export default useDepositBond
