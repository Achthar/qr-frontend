import { useCallback } from 'react'
import { redeemBond, redeemPositions } from 'utils/calls'
import { useBondContract } from 'hooks/useContract'
import { BondConfig } from 'config/constants/types'

const useRedeemBond = (chainId: number, account: string, bond: BondConfig) => {
  const bondContract = useBondContract(chainId)

  const handleRedeem = useCallback(async () => {
    await redeemBond(chainId, account, bondContract, bond.bondId)
  }, [bondContract, bond.bondId, account, chainId])

  return { onRedeem: handleRedeem }
}

export const useRedeemNotes = (chainId: number, account: string, noteIndexes: number[], sendGREQ: boolean) => {
  const bondContract = useBondContract(chainId)

  const handleRedeem = useCallback(async () => {
    await redeemPositions(chainId, account, bondContract, noteIndexes, sendGREQ)
  }, [bondContract, noteIndexes, account, chainId, sendGREQ])

  return { onRedeem: handleRedeem }
}

export default useRedeemBond
