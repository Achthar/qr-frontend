import React from 'react'
import styled from 'styled-components'
import { Tag, Flex, Heading, Skeleton } from '@requiemswap/uikit'
import { PoolType, Token } from '@requiemswap/sdk'
import { CommunityTag, CoreTag } from 'components/Tags'
import { TokenPairImage } from 'components/TokenImage'
import QuadCurrencyLogo from 'components/Logo/QuadLogo'
import { deserializeToken } from 'state/user/hooks/helpers'
import { SerializedToken } from 'config/constants/types'
import PoolLogo from 'components/Logo/PoolLogo'

export interface ExpandableSectionProps {
  lpLabel?: string
  multiplier?: string
  isCommunityFarm?: boolean
  tokens: SerializedToken[]
  quoteTokenIndex: number
}

const Wrapper = styled(Flex)`
  svg {
    margin-right: 4px;
  }
`

const MultiplierTag = styled(Tag)`
  margin-left: 4px;
`

const CardHeading: React.FC<ExpandableSectionProps> = ({ lpLabel, multiplier, isCommunityFarm, quoteTokenIndex, tokens }) => {
  return (
    <Wrapper justifyContent="space-between" alignItems="center" mb="12px">
      {/* {
        poolType !== PoolType.StablePairWrapper && token && quoteToken ? (
          <TokenPairImage variant="inverted" chainId={token.chainId} primaryToken={token} secondaryToken={quoteToken} width={64} height={64} />
        )
          : token2 && token3 && (
            <QuadCurrencyLogo
              currency0={token}
              currency1={quoteToken}
              currency2={token2}
              currency3={token3}
              size={24}
              margin
            />
          )
      } */}
      <PoolLogo tokens={tokens.map(t => deserializeToken(t))} />
      <Flex flexDirection="column" alignItems="flex-end">
        <Heading mb="4px">{lpLabel.split(' ')[0]}</Heading>
        <Flex justifyContent="center">
          {isCommunityFarm ? <CommunityTag /> : <CoreTag />}
          {multiplier ? (
            <MultiplierTag variant="secondary">{multiplier}</MultiplierTag>
          ) : (
            <Skeleton ml="4px" width={42} height={28} />
          )}
        </Flex>
      </Flex>
    </Wrapper>
  )
}

export default CardHeading
