import { useCallback } from 'react'
import { stakeBond } from 'utils/calls'
import { useBondContract } from 'hooks/useContract'

const useStakeBonds = (chainId: number, bondId: number) => {
  const bondCalculator = useBondContract(chainId)

  const handleStake = useCallback(
    async (amount: string) => {
      const txHash = await stakeBond(bondCalculator, bondId, amount)
      console.info(txHash)
    },
    [bondCalculator, bondId],
  )

  return { onStake: handleStake }
}

export default useStakeBonds
