import { useCallback } from 'react'
import { unstakeBond } from 'utils/calls'
import { useBondContract } from 'hooks/useContract'
import { BondConfig } from 'config/constants/types'

const useUnstakeBonds = (chainId: number, bond: BondConfig) => {
  const bondContract = useBondContract(chainId, bond, true)

  const handleUnstake = useCallback(
    async (amount: string) => {
      await unstakeBond(bondContract, bond.bondId, amount)
    },
    [bondContract, bond.bondId],
  )

  return { onUnstake: handleUnstake }
}

export default useUnstakeBonds
