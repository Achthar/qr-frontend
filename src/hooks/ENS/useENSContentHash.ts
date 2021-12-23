import { namehash } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useSingleCallResult } from '../../state/multicall/hooks'
import isZero from '../../utils/isZero'
import { useENSRegistrarContract, useENSResolverContract } from '../useContract'

/**
 * Does a lookup for an ENS name to find its contenthash.
 */
export default function useENSContentHash(chainId: number, ensName?: string | null): { loading: boolean; contenthash: string | null } {
  const ensNodeArgument = useMemo(() => {
    if (!ensName) return [undefined]
    try {
      return ensName ? [namehash(ensName)] : [undefined]
    } catch (error: any) {
      return [undefined]
    }
  }, [ensName])
  const registrarContract = useENSRegistrarContract(chainId, false)
  const resolverAddressResult = useSingleCallResult(chainId, registrarContract, 'resolver', ensNodeArgument)
  const resolverAddress = resolverAddressResult.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddress && isZero(resolverAddress) ? undefined : resolverAddress,
    false,
  )
  const contenthash = useSingleCallResult(chainId, resolverContract, 'contenthash', ensNodeArgument)

  return {
    contenthash: contenthash.result?.[0] ?? null,
    loading: resolverAddressResult.loading || contenthash.loading,
  }
}
