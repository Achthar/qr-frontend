import { useCallback } from 'react'
import { redeemCallNote, redeemCallPositions } from 'utils/calls'
import { useCallableBondContract } from 'hooks/useContract'
import { BondConfig } from 'config/constants/types'

const useRedeemNote = (chainId: number, account: string, noteIndex:number) => {
  const bondContract = useCallableBondContract(chainId)

  const handleRedeem = useCallback(async () => {
    await redeemCallNote(chainId, account, bondContract, noteIndex)
  }, [bondContract, noteIndex, account, chainId])

  return { onRedeem: handleRedeem }
}

export const useRedeemNotes = (chainId: number, account: string, noteIndexes: number[]) => {
  const bondContract = useCallableBondContract(chainId)

  const handleRedeem = useCallback(async () => {
    await redeemCallPositions(chainId, account, bondContract, noteIndexes)
  }, [bondContract, noteIndexes, account, chainId])

  return { onRedeem: handleRedeem }
}

export default useRedeemNote
