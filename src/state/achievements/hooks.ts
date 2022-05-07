import { useEffect } from 'react'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useSelector } from 'react-redux'
import { useAppDispatch } from 'state'
import { State, AchievementState } from '../types'
import { fetchAchievements } from '.'

export const useFetchAchievements = () => {
  const { account } = useActiveWeb3React()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (account) {
      dispatch(fetchAchievements(account))
    }
  }, [account, dispatch])
}

export const useAchievements = () => {
  const achievements: AchievementState['data'] = useSelector((state: State) => state.achievements.data)
  return achievements
}
