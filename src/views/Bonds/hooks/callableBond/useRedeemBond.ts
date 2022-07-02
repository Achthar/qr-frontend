import { useCallback } from 'react'
import { redeemCallableNote, redeemCallablePositions } from 'utils/calls'
import { useCallableBondContract } from 'hooks/useContract'
import { BondConfig } from 'config/constants/types'

const useRedeemCallableNote = (chainId: number, account: string, noteIndex:number) => {
  const bondContract = useCallableBondContract(chainId)

  const handleRedeem = useCallback(async () => {
    await redeemCallableNote(chainId, account, bondContract, noteIndex)
  }, [bondContract, noteIndex, account, chainId])

  return { onRedeem: handleRedeem }
}

export const useRedeemCallableNotes = (chainId: number, account: string, noteIndexes: number[]) => {
  const bondContract = useCallableBondContract(chainId)

  const handleRedeem = useCallback(async () => {
    await redeemCallablePositions(chainId, account, bondContract, noteIndexes)
  }, [bondContract, noteIndexes, account, chainId])

  return { onRedeem: handleRedeem }
}

export default useRedeemCallableNote
