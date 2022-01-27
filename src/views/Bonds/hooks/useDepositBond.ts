import { useCallback } from 'react'
import { stakeBond, startBonding } from 'utils/calls'
import { useBondDepositoryContract } from 'hooks/useContract'
import { getContractForBond } from 'utils/contractHelpers'
import { BondConfig } from 'config/constants/types'

const useDepositBond = (chainId: number, account: string, library: any, bond: BondConfig) => {
  const bondDepositoryContract = getContractForBond(chainId, bond, account ? library.getSigner() : library)

  console.log("BDCONTRACT", bondDepositoryContract.address)
  const handleBonding = useCallback(
    async (amount: string, maxPrice: string) => {
      const txHash = await startBonding(chainId, account, bondDepositoryContract, bond.bondId, amount, maxPrice)
      console.info(txHash)
    },
    [bondDepositoryContract, bond.bondId, account, chainId],
  )

  return { onBonding: handleBonding }
}

export default useDepositBond
