import { Token, TokenAmount } from '@requiemswap/sdk'
import { useMemo } from 'react'
import { ethers } from 'ethers'
import { useTokenContract } from './useContract'
import { useMultipleContractSingleData, useSingleCallResult } from '../state/multicall/hooks'

import ERC20_ABI from '../config/abi/erc20.json'

function useTokenAllowance(chainId: number, token?: Token, owner?: string, spender?: string): TokenAmount | undefined {
  const contract = useTokenContract(token?.address, false)

  const inputs = useMemo(() => [owner, spender], [owner, spender])
  const allowance = useSingleCallResult(chainId, contract, 'allowance', inputs).result

  return useMemo(
    () => (token && allowance ? new TokenAmount(token, allowance.toString()) : undefined),
    [token, allowance],
  )
}

export function useTokenAllowances(chainId: number, tokens?: Token[], owner?: string, spender?: string): { amounts: TokenAmount[] | undefined, isLoading: boolean } {

  const inputs = useMemo(() => [owner, spender], [owner, spender])
  const addresses = tokens?.map(t => t?.address)
  console.log("MCPARAMS", addresses?.length > 0 ? addresses : [undefined], addresses?.length > 0 ? addresses.map((_) => { return inputs }) : [undefined, undefined])
  const allowances = useMultipleContractSingleData(
    chainId,
    addresses?.length > 0 ? addresses : [undefined], new ethers.utils.Interface(ERC20_ABI),
    'allowance',
    addresses?.length > 0 ? inputs : [undefined, undefined])

  return useMemo(
    () => {
      const isLoading = Boolean(addresses && allowances && allowances[0]?.loading)
      return { amounts: tokens && allowances && allowances?.map((a, i) => new TokenAmount(tokens[i], a?.result?.toString() ?? '0')), isLoading }
    },
    [tokens, allowances, addresses])

}

export default useTokenAllowance
