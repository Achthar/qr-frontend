import { useCallback } from 'react'
import { unstakeBond } from 'utils/calls'
import { useBondContract } from 'hooks/useContract'

const useUnstakeBonds = (chainId: number, bondId: number) => {
  const bondContract = useBondContract(chainId)

  const handleUnstake = useCallback(
    async (amount: string) => {
      await unstakeBond(bondContract, bondId, amount)
    },
    [bondContract, bondId],
  )

  return { onUnstake: handleUnstake }
}

export default useUnstakeBonds
