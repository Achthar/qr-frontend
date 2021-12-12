import { useCallback } from 'react'
import { stakeBond } from 'utils/calls'
import { useMasterchef } from 'hooks/useContract'

const useStakeBonds = (bondId: number) => {
  const masterChefContract = useMasterchef()

  const handleStake = useCallback(
    async (amount: string) => {
      const txHash = await stakeBond(masterChefContract, bondId, amount)
      console.info(txHash)
    },
    [masterChefContract, bondId],
  )

  return { onStake: handleStake }
}

export default useStakeBonds
