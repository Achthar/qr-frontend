import { useCallback } from 'react'
import { stakeBond, startBonding } from 'utils/calls'
import { useBondDepositoryContract } from 'hooks/useContract'
import { getContractForBond } from 'utils/contractHelpers'

const useDepositBond = (chainId: number, account: string, library: any, bondId: number) => {
  const bondDepositoryContract = getContractForBond(chainId, account ? library.getSigner() : library)

  console.log("BDCONTRACT", bondDepositoryContract.address)
  const handleBonding = useCallback(
    async (amount: string, maxPrice: string) => {
      const txHash = await startBonding(chainId, account, bondDepositoryContract, bondId, amount, maxPrice)
      console.info(txHash)
    },
    [bondDepositoryContract, bondId, account, chainId],
  )

  return { onBonding: handleBonding }
}

export default useDepositBond
