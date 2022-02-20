import { BigNumber } from 'ethers'
import { useSingleCallResult } from '../state/multicall/hooks'
import { useMulticallContract } from './useContract'

// gets the current timestamp from the blockchain
export default function useCurrentBlockTimestamp(chainId: number): BigNumber | undefined {
  const multicall = useMulticallContract(chainId)
  return useSingleCallResult(chainId, multicall, 'getCurrentBlockTimestamp')?.result?.[0]
}
