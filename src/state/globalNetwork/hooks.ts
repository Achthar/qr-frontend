import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, AppState } from '../index'
import { setChainId } from './actions'

export function useNetworkState(): AppState['globalNetwork'] {
  return useSelector<AppState, AppState['globalNetwork']>((state) => state.globalNetwork)
}

export function useGlobalNetworkActionHandlers(): {
  onChainChange: (chainId: number) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onChainChange = useCallback(
    (chainId: number) => {
      dispatch(setChainId({ chainId }))
    },
    [dispatch],
  )

  return {
    onChainChange
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