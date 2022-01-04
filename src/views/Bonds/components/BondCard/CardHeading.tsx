import React from 'react'
import styled from 'styled-components'
import { Tag, Flex, Heading } from '@requiemswap/uikit'
import { CommunityTag, CoreTag } from 'components/Tags'
import { Token } from '@requiemswap/sdk'
import { TokenPairImage } from 'components/TokenImage'

export interface ExpandableSectionProps {
  chainId: number,
  lpLabel?: string
  isCommunityBond?: boolean
  token: Token
  quoteToken: Token
}

const Wrapper = styled(Flex)`
  svg {
    margin-right: 4px;
  }
`

const MultiplierTag = styled(Tag)`
  margin-left: 4px;
`

const CardHeading: React.FC<ExpandableSectionProps> = ({ chainId, lpLabel, isCommunityBond, token, quoteToken }) => {
  return (
    <Wrapper justifyContent="space-between" alignItems="center" mb="12px">
      <TokenPairImage variant="inverted" chainId={chainId} primaryToken={token} secondaryToken={quoteToken} width={64} height={64} />
      <Flex flexDirection="column" alignItems="flex-end">
        <Heading mb="4px">{lpLabel.split(' ')[0]}</Heading>
        <Flex justifyContent="center">
          {isCommunityBond ? <CommunityTag /> : <CoreTag />}
        </Flex>
      </Flex>
    </Wrapper>
  )
}

export default CardHeading
