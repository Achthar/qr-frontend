import React, { useMemo, useState } from 'react'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'
import { Card, Flex, Text, Skeleton, Button, Heading, Tag, Box } from '@requiemswap/uikit'
import { DeserializedFarm } from 'state/types'
import { useTranslation } from 'contexts/Localization'
import ExpandableSectionButton from 'components/ExpandableSectionButton'
import { getFullDisplayBalance, formatNumber, formatSerializedBigNumber, formatBigNumber, formatGeneralNumber } from 'utils/formatBalance'

import { Lock } from 'state/governance/reducer'
import { prettifySeconds } from 'config'



const Wrapper = styled(Flex)`
  svg {
    margin-right: 4px;
  }
`

const StyledButton = styled(Button) <{ mB: string, width: string }>`
  background-color:none;
  color: none;
  height: 25px;
  box-shadow: none;
  border-radius: 2px;
  width: ${({ width }) => width};
  align: right;
  marginBottom: ${({ mB }) => mB};
`

const MultiplierTag = styled(Tag)`
  margin-left: 4px;
`

const LockBox = styled(Box) <{ isFirst: boolean, isLast: boolean, selected: boolean }>`
  margin-top: 5px;
  align-self: baseline;
  border-radius: 2px;
  background:  #121212;
  border: solid 2px ${({ theme, selected }) => selected ? 'white' : theme.colors.cardBorder};
  border-top-left-radius: ${({ isFirst }) => isFirst ? '16px' : '0px'};
  border-top-right-radius: ${({ isFirst }) => isFirst ? '16px' : '0px'};
  border-bottom-left-radius: ${({ isLast }) => isLast ? '16px' : '0px'};
  border-bottom-right-radius: ${({ isLast }) => isLast ? '16px' : '0px'};
  width: 100%;
`

const InnerContainer = styled(Flex)`
  flex-direction: column;
  justify-content: space-around;
  padding: 24px;
`

const ExpandingWrapper = styled.div`
  padding: 24px;
  border-top: 2px solid ${({ theme }) => theme.colors.cardBorder};
  overflow: hidden;
`

interface LockCardProps {
  chainId: number
  lock: Lock
  onSelect: () => void
  reqPrice: number
  refTime: number
  selected: boolean
  isFirst: boolean
  isLast: boolean
  hideSelect: boolean
}

interface LockHeaderProps {
  refTime: number
  lock: Lock
  onSelect: () => void
  hideSelect: boolean
}


const LockHeading: React.FC<LockHeaderProps> = ({ onSelect, lock, refTime, hideSelect }) => {
  const timeCounter = useMemo(() => { return prettifySeconds(Number(lock.end) - refTime ?? 0, 'hour'); }, [lock, refTime])

  return (
    <>
      <Flex justifyContent="space-between">
        <Text mb="4px" bold >{timeCounter}</Text>
        {/* <Flex justifyContent="center">
          {isCommunityFarm ? <CommunityTag /> : <CoreTag />}
          {multiplier ? (
            <MultiplierTag variant="secondary">{multiplier}</MultiplierTag>
          ) : (
            <Skeleton ml="4px" width={42} height={28} />
          )}
        </Flex> */}
        {!hideSelect ? (<StyledButton onClick={onSelect} > Select </StyledButton>) : (<Text> Selected </Text>)}
      </Flex>
    </>
  )
}

const LockCard: React.FC<LockCardProps> = ({ chainId, lock, onSelect, reqPrice, refTime, selected, isFirst, isLast, hideSelect }) => {

  return (
    <LockBox isFirst={isFirst} isLast={isLast} selected={selected}>
      <InnerContainer>
        <LockHeading
          lock={lock}
          refTime={refTime}
          onSelect={onSelect}
          hideSelect={hideSelect}
        />
        <Flex justifyContent="space-between">
          <Text size='5px'>Locked</Text>
          <Text >{formatGeneralNumber(formatSerializedBigNumber(lock.amount, 10, 18), 2)}</Text>
        </Flex>
        <Flex justifyContent="space-between">
          <Text size='5px'>Value</Text>
          <Text >${formatGeneralNumber(Number(formatSerializedBigNumber(lock.amount, 10, 18)) * reqPrice, 2)}</Text>
        </Flex>
        <Flex justifyContent="space-between">
          <Text size='5px'>Minted</Text>
          <Text >{formatGeneralNumber(formatSerializedBigNumber(lock.minted, 10, 18), 2)}</Text>
        </Flex>
      </InnerContainer>


    </LockBox>
  )
}

export default LockCard
