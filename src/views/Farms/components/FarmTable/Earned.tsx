import React from 'react'
import styled from 'styled-components'
import { Skeleton } from '@requiemswap/uikit'
import { prettifySeconds } from 'config'

export interface EarnedProps {
  earnings: number
  earningMaturity: number
  pid: number
}

interface EarnedPropsWithLoading extends EarnedProps {
  userDataReady: boolean
}

const Amount = styled.span<{ earned: number }>`
  color: ${({ earned, theme }) => (earned ? theme.colors.text : theme.colors.textDisabled)};
  display: flex;
  align-items: center;
`

const Earned: React.FunctionComponent<EarnedPropsWithLoading> = ({ earnings, earningMaturity, userDataReady }) => {
  if (userDataReady) {
    return <>
      <Amount earned={earnings}>{earnings.toLocaleString()}</Amount>
      {/* {prettifySeconds(earningMaturity, 'day')} */}
    </>
  }
  return (
    <Amount earned={0}>
      <Skeleton width={60} />
    </Amount>
  )
}

export default Earned
