import { useCallback } from 'react'
import { redeemBond } from 'utils/calls'
import { useBondContract } from 'hooks/useContract'

const useRedeemBond = (chainId: number, bondId: number) => {
  const bondContract = useBondContract(chainId)

  const handleRedeem = useCallback(async () => {
    await redeemBond(bondContract, bondId)
  }, [bondContract])

  return { onReward: handleRedeem }
}

export default useRedeemBond
