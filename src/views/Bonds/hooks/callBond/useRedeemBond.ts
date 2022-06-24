import { useCallback } from 'react'
import { redeemNote, redeemPositions } from 'utils/calls'
import { useBondContract } from 'hooks/useContract'
import { BondConfig } from 'config/constants/types'

const useRedeemNote = (chainId: number, account: string, noteIndex:number) => {
  const bondContract = useBondContract(chainId)

  const handleRedeem = useCallback(async () => {
    await redeemNote(chainId, account, bondContract, noteIndex)
  }, [bondContract, noteIndex, account, chainId])

  return { onRedeem: handleRedeem }
}

export const useRedeemNotes = (chainId: number, account: string, noteIndexes: number[]) => {
  const bondContract = useBondContract(chainId)

  const handleRedeem = useCallback(async () => {
    await redeemPositions(chainId, account, bondContract, noteIndexes)
  }, [bondContract, noteIndexes, account, chainId])

  return { onRedeem: handleRedeem }
}

export default useRedeemNote
