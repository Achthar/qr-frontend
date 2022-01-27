import { useCallback } from 'react'
import { redeemBond } from 'utils/calls'
import { useBondContract } from 'hooks/useContract'
import { BondConfig } from 'config/constants/types'

const useRedeemBond = (chainId: number, account: string, bond: BondConfig) => {
  const bondContract = useBondContract(chainId, bond)

  const handleRedeem = useCallback(async () => {
    await redeemBond(chainId, account, bondContract, bond.bondId)
  }, [bondContract, bond.bondId, account, chainId])

  return { onRedeem: handleRedeem }
}

export default useRedeemBond
