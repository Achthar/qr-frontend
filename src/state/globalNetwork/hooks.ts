import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, AppState } from '../index'
import { setChainId, setAccount } from './actions'

export function useNetworkState(): AppState['globalNetwork'] {
  return useSelector<AppState, AppState['globalNetwork']>((state) => state.globalNetwork)
}

export function useGlobalNetworkActionHandlers(): {
  onChainChange: (chainId: number) => void
  onAccountChange: (account: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onChainChange = useCallback(
    (chainId: number) => {
      dispatch(setChainId({ chainId }))
    },
    [dispatch],
  )
  const onAccountChange = useCallback(
    (account: string) => {
      dispatch(setAccount({ account }))
    },
    [dispatch],
  )
  return {
    onChainChange,
    onAccountChange
  }
}

// export function useChainId(
// ): {
//   chainId: number
// } {


//   const { chainId} = useNetworkState()



//   return {
//     chain
//   }
// }