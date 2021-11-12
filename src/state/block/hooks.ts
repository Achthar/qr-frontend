import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { useAppDispatch } from 'state'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { simpleRpcProvider } from 'utils/providers'
import { setBlock } from '.'
import { State } from '../types'


export const usePollBlockNumber = () => {
  const timer = useRef(null)
  const dispatch = useAppDispatch()
  const isWindowVisible = useIsWindowVisible()
  const { chainId } = useNetworkState()
  useEffect(() => {
    if (isWindowVisible) {
      timer.current = setInterval(async () => {
        const blockNumber = await simpleRpcProvider(chainId).getBlockNumber()
        dispatch(setBlock(blockNumber))
      }, 6000)
    } else {
      clearInterval(timer.current)
    }

    return () => clearInterval(timer.current)
  }, [chainId, dispatch, timer, isWindowVisible])
}

export const useBlock = () => {
  return useSelector((state: State) => state.block)
}

export const useInitialBlock = () => {
  return useSelector((state: State) => state.block.initialBlock)
}
