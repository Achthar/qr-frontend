import React, { useState } from 'react'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'
import { Card, Flex, Text, Skeleton } from '@requiemswap/uikit'
import { Bond } from 'state/types'
import { getNetworkExplorerLink } from 'utils'
import tokens, { getSerializedToken, REQT, USDC } from 'config/constants/tokens'
import { useTranslation } from 'contexts/Localization'
import ExpandableSectionButton from 'components/ExpandableSectionButton'
import { BASE_ADD_LIQUIDITY_URL } from 'config'
import { getAddress } from 'utils/addressHelpers'
import { deserializeToken } from 'state/user/hooks/helpers'
import getWeightedLiquidityUrlPathParts from 'utils/getWeightedLiquidityUrlPathParts'
import { useNetworkState } from 'state/globalNetwork/hooks'
import DetailsSection from './DetailsSection'
import CardHeading from './CardHeading'
import CardActionsContainer from './CardActionsContainer'
import ApyButton from './ApyButton'


export interface BondWithStakedValue extends Bond {
  apr?: number
  lpRewardsApr?: number
  liquidity?: BigNumber
}

const StyledCard = styled(Card)`
  align-self: baseline;
`

const BondCardInnerContainer = styled(Flex)`
  flex-direction: column;
  justify-content: space-around;
  padding: 24px;
`

const ExpandingWrapper = styled.div`
  padding: 24px;
  border-top: 2px solid ${({ theme }) => theme.colors.cardBorder};
  overflow: hidden;
`

interface BondCardProps {
  bond: BondWithStakedValue
  displayApr: string
  removed: boolean
  reqtPrice?: BigNumber
  account?: string
}

const BondCard: React.FC<BondCardProps> = ({ bond, displayApr, removed, reqtPrice, account }) => {
  const { t } = useTranslation()
  const { chainId } = useNetworkState()
  const [showExpandableSection, setShowExpandableSection] = useState(false)

  const totalValueFormatted =
    bond.liquidity && bond.liquidity.gt(0)
      ? `$${bond.liquidity.toNumber().toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : ''

  const lpLabel = bond.name && bond.name.toUpperCase().replace('REQUIEM', '')
  const earnLabel = 'Yield'

  const liquidityUrlPathParts = getWeightedLiquidityUrlPathParts({
    chainId,
    quoteTokenAddress: bond?.quoteToken?.address,
    tokenAddress: bond?.token?.address,
    weightQuote: bond?.lpProperties?.weightQuoteToken,
    weightToken: bond?.lpProperties?.weightToken,
    fee: bond?.lpProperties?.fee
  })
  const addLiquidityUrl = `${BASE_ADD_LIQUIDITY_URL}/${liquidityUrlPathParts}`
  const lpAddress = getAddress(chainId, bond.reserveAddress)
  const isPromotedBond = true

  return (
    <StyledCard isActive={isPromotedBond}>
      <BondCardInnerContainer>
        <CardHeading
          chainId={chainId}
          lpLabel={lpLabel}
          isCommunityBond={false}
          token={deserializeToken(getSerializedToken(chainId, tokens.reqt))}
          quoteToken={deserializeToken(getSerializedToken(chainId, tokens.usdc))}
        />
        {!removed && (
          <Flex justifyContent="space-between" alignItems="center">
            <Text>{t('APR')}:</Text>
            <Text bold style={{ display: 'flex', alignItems: 'center' }}>
              {bond.apr ? (
                <ApyButton
                  variant="text-and-button"
                  bondId={bond.bondId}
                  lpSymbol={bond.name}
                  lpLabel={lpLabel}
                  addLiquidityUrl={addLiquidityUrl}
                  reqtPrice={reqtPrice}
                  apr={bond.apr}
                  displayApr={displayApr}
                />
              ) : (
                <Skeleton height={24} width={80} />
              )}
            </Text>
          </Flex>
        )}
        <Flex justifyContent="space-between">
          <Text>{t('Earn')}:</Text>
          <Text bold>{earnLabel}</Text>
        </Flex>
        <CardActionsContainer
          bond={bond}
          lpLabel={lpLabel}
          account={account}
          reqtPrice={reqtPrice}
          addLiquidityUrl={addLiquidityUrl}
        />
      </BondCardInnerContainer>

      <ExpandingWrapper>
        <ExpandableSectionButton
          onClick={() => setShowExpandableSection(!showExpandableSection)}
          expanded={showExpandableSection}
        />
        {showExpandableSection && (
          <DetailsSection
            removed={removed}
            bscScanAddress={getNetworkExplorerLink(lpAddress, 'address')}
            infoAddress={`https://requiem.info/pool/${lpAddress}`}
            totalValueFormatted={totalValueFormatted}
            lpLabel={lpLabel}
            addLiquidityUrl={addLiquidityUrl}
          />
        )}
      </ExpandingWrapper>
    </StyledCard>
  )
}

export default BondCard
