import { namehash } from 'ethers/lib/utils'
import { useMemo } from 'react'
import { useSingleCallResult } from '../../state/multicall/hooks'
import { isAddress } from '../../utils'
import isZero from '../../utils/isZero'
import { useENSRegistrarContract, useENSResolverContract } from '../useContract'
import useDebounce from '../useDebounce'

/**
 * Does a reverse lookup for an address to find its ENS name.
 * Note this is not the same as looking up an ENS name to find an address.
 */
export default function useENSName(chainId:number, address?: string): { ENSName: string | null; loading: boolean } {
  const debouncedAddress = useDebounce(address, 200)
  const ensNodeArgument = useMemo(() => {
    if (!debouncedAddress || !isAddress(debouncedAddress)) return [undefined]
    try {
      return debouncedAddress ? [namehash(`${debouncedAddress.toLowerCase().substr(2)}.addr.reverse`)] : [undefined]
    } catch (error: any) {
      return [undefined]
    }
  }, [debouncedAddress])
  const registrarContract = useENSRegistrarContract(chainId, false)
  const resolverAddress = useSingleCallResult(chainId,  registrarContract, 'resolver', ensNodeArgument)
  const resolverAddressResult = resolverAddress.result?.[0]
  const resolverContract = useENSResolverContract(
    resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined,
    false,
  )
  const name = useSingleCallResult(chainId, resolverContract, 'name', ensNodeArgument)

  const changed = debouncedAddress !== address
  return {
    ENSName: changed ? null : name.result?.[0] ?? null,
    loading: changed || resolverAddress.loading || name.loading,
  }
}
