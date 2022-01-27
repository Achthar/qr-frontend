import { useCallback } from 'react'
import { stakeBond } from 'utils/calls'
import { useBondContract } from 'hooks/useContract'
import { BondConfig } from 'config/constants/types'

const useStakeBonds = (chainId: number, bond: BondConfig) => {
  const bondCalculator = useBondContract(chainId, bond)

  const handleStake = useCallback(
    async (amount: string) => {
      const txHash = await stakeBond(bondCalculator, bond.bondId, amount)
      console.info(txHash)
    },
    [bondCalculator, bond.bondId],
  )

  return { onStake: handleStake }
}

export default useStakeBonds
