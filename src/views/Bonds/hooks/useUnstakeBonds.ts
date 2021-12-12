import { useCallback } from 'react'
import { unstakeBond } from 'utils/calls'
import { useMasterchef } from 'hooks/useContract'

const useUnstakeBonds = (bondId: number) => {
  const masterChefContract = useMasterchef()

  const handleUnstake = useCallback(
    async (amount: string) => {
      await unstakeBond(masterChefContract, bondId, amount)
    },
    [masterChefContract, bondId],
  )

  return { onUnstake: handleUnstake }
}

export default useUnstakeBonds
