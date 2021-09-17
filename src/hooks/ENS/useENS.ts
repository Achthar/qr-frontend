import { isAddress } from '../../utils'
import useENSAddress from './useENSAddress'
import useENSName from './useENSName'

/**
 * Given a name or address, does a lookup to resolve to an address and name
 * @param nameOrAddress ENS name or address
 */
export default function useENS(chainId:number, nameOrAddress?: string | null): {
  loading: boolean
  address: string | null
  name: string | null
} {
  const validated = isAddress(nameOrAddress)
  const reverseLookup = useENSName(chainId, validated || undefined)
  const lookup = useENSAddress(chainId, nameOrAddress)

  return {
    loading: reverseLookup.loading || lookup.loading,
    address: validated || lookup.address,
    name: reverseLookup.ENSName ? reverseLookup.ENSName : !validated && lookup.address ? nameOrAddress || null : null,
  }
}
