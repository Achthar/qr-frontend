import { useCallback } from 'react'
import { redeemBond } from 'utils/calls'
import { useBondContract } from 'hooks/useContract'

const useRedeemBond = (chainId: number, account, bondId: number) => {
  const bondContract = useBondContract(chainId)

  const handleRedeem = useCallback(async () => {
    await redeemBond(chainId, account, bondContract, bondId)
  }, [bondContract, bondId, account, chainId])

  return { onRedeem: handleRedeem }
}

export default useRedeemBond
