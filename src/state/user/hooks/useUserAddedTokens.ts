import { useMemo } from 'react'
import { ChainId, Token } from '@requiemswap/sdk'
import { useSelector } from 'react-redux'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { AppState } from '../../index'
import { deserializeToken } from './helpers'

export default function useUserAddedTokens(): Token[] {
  const { chainId } = useNetworkState()
  const serializedTokensMap = useSelector<AppState, AppState['user']['tokens']>(({ user: { tokens } }) => tokens)

  return useMemo(() => {
    if (!chainId) return []
    return Object.values(serializedTokensMap?.[chainId as ChainId] ?? {}).map(deserializeToken)
  }, [serializedTokensMap, chainId])
}
