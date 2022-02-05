/* eslint react/destructuring-assignment: 0 */

import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { BondWithStakedValue } from 'views/Bonds/components/BondCard/BondCard'
import { useMatchBreakpoints, Text, Flex } from '@requiemswap/uikit'
import { useTranslation } from 'contexts/Localization'
import useDelayedUnmount from 'hooks/useDelayedUnmount'
import { useBondFromBondId, useBondUser } from 'state/bonds/hooks'
import { useBlock } from 'state/block/hooks'
import { prettifySeconds, secondsUntilBlock } from 'config'
import Roi, { RoiProps } from './Roi'
import Apr, { AprProps } from './Apr'
import Bond, { BondProps } from './Bond'
import Earned, { EarnedProps } from './Earned'
import Details from './Details'
import Multiplier, { MultiplierProps } from './Multiplier'
import Liquidity, { LiquidityProps } from './Liquidity'
import ActionPanel from './Actions/ActionPanel'
import CellLayout from './CellLayout'
import { DesktopColumnSchema, MobileColumnSchema } from '../types'
import BondMobile from './BondMobile'

export interface RowProps {
  bond: BondProps
  details: BondWithStakedValue
  discount: number
  price: number
  roi: RoiProps
  purchased: number
  term: number
  reqPrice?: number
}

interface RowPropsWithLoading extends RowProps {
  userDataReady: boolean
}

const cells = {
  bond: Bond,
  // earned: Earned,
  details: Details,
  liquidity: Liquidity,
  roi: Roi

}

const CellInner = styled.div`
  padding: 24px 0px;
  display: flex;
  width: 100%;
  align-items: center;
  padding-right: 8px;

  ${({ theme }) => theme.mediaQueries.xl} {
    padding-right: 32px;
  }
`

const CellOuter = styled.div`
  padding: 24px 0px;
  display: flex;
  width: 100%;
  align-items: right;
  padding-right: 8px;

  ${({ theme }) => theme.mediaQueries.xl} {
    padding-right: 32px;
  }
`

const StyledTr = styled.tr`
  cursor: pointer;
  border-bottom: 2px solid ${({ theme }) => theme.colors.cardBorder};
`

const EarnedMobileCell = styled.td`
  padding: 16px 0 24px 16px;
`

const TermMobileCell = styled.td`
  padding: 16px 0 24px 8px;
  padding-right: 10px;
  width: 25%;
`
const DiscountMobileCell = styled.td`
  padding-top: 16px;
  padding-bottom: 24px;
  padding-left: 10px;
  width: 25%;
`

const AprMobileCell = styled.td`
  padding-top: 16px;
  padding-bottom: 24px;
  width: 25%;
`

const BondMobileCell = styled.td`
  padding-top: 24px;
`

const Row: React.FunctionComponent<RowPropsWithLoading> = (props) => {
  const { details, userDataReady } = props
  const hasStakedAmount = !!useBondUser(details.bondId).stakedBalance.toNumber()
  const [actionPanelExpanded, setActionPanelExpanded] = useState(hasStakedAmount)
  const shouldRenderChild = useDelayedUnmount(actionPanelExpanded, 300)
  const { t } = useTranslation()

  const bond = useBondFromBondId(details.bondId)

  const toggleActionPanel = () => {
    setActionPanelExpanded(!actionPanelExpanded)
  }

  useEffect(() => {
    setActionPanelExpanded(hasStakedAmount)
  }, [hasStakedAmount])

  const { isDesktop, isMobile } = useMatchBreakpoints()

  const isSmallerScreen = !isDesktop
  const tableSchema = isSmallerScreen ? MobileColumnSchema : DesktopColumnSchema
  const columnNames = tableSchema.map((column) => column.name)

  const { currentBlock } = useBlock()

  const vestingPeriod = () => {
    const vestingBlock = parseInt(currentBlock.toString()) + parseInt(bond.bondTerms?.vesting ?? '0');
    const seconds = secondsUntilBlock(bond.token?.chainId ?? 43113, currentBlock, vestingBlock);
    return prettifySeconds(seconds, isMobile ? 'day' : 'hour');
  };

  const handleRenderRow = () => {
    if (!isMobile) {
      return (
        <StyledTr onClick={toggleActionPanel}>
          {Object.keys(props).map((key) => {
            const columnIndex = columnNames.indexOf(key)
            if (columnIndex === -1) {
              return null
            }

            switch (key) {
              case 'details':
                return (
                  <td key={key}>
                    <CellInner>
                      <CellLayout>
                        <Details actionPanelToggled={actionPanelExpanded} />
                      </CellLayout>
                    </CellInner>
                  </td>
                )
              case 'discount':
                return (
                  <td key={key}>
                    <CellInner>
                      <CellLayout label='Discount'>
                        <Text>
                          {`${Math.round(props.discount * 100000) / 1000}%`}
                        </Text>
                      </CellLayout>
                    </CellInner>
                  </td>
                )
              case 'price':
                return (
                  <td key={key}>
                    <CellInner>
                      <CellLayout label={t('Price')}>
                        <Text>
                          {`$${Math.round(props.price * 10000) / 10000}`}
                        </Text>
                      </CellLayout>
                    </CellInner>
                  </td>
                )
              case 'purchased':
                return (
                  <td key={key}>
                    <CellInner>
                      <CellLayout label={t('Purchased')}>
                        <Text>
                          {props.purchased}
                        </Text>
                      </CellLayout>
                    </CellInner>
                  </td>
                )
              case 'term':
                return (
                  <td key={key}>
                    <CellInner>
                      <CellLayout label={t('Vesting Term')}>
                        <Text>
                          {vestingPeriod()}
                        </Text>
                      </CellLayout>
                    </CellInner>
                  </td>
                )
              case 'roi':
                return (
                  <td key={key}>
                    <CellInner>
                      <CellLayout label={t('ROI')}>
                        <Text>
                          <Roi {...props.roi} hideButton={isSmallerScreen} />
                        </Text>
                      </CellLayout>
                    </CellInner>
                  </td>
                )
              default:
                return (
                  <td key={key}>
                    <CellInner>
                      <CellLayout label={t(tableSchema[columnIndex].label)}>
                        {React.createElement(cells[key], { ...props[key], userDataReady })}
                      </CellLayout>
                    </CellInner>
                  </td>
                )
            }
          })}
        </StyledTr >
      )
    }

    return (
      <StyledTr onClick={toggleActionPanel}>
        <Flex flexDirection="column" mb="8px">
          <tr>
            <BondMobileCell>
              <CellLayout>
                <BondMobile {...props.bond} />
              </CellLayout>
            </BondMobileCell>
            <BondMobileCell>
              <div style={{ marginLeft: 25 }}>
                <Text bold >
                  {bond.name}
                </Text>
              </div>
            </BondMobileCell>
          </tr>
          <td>
            <tr>
              <TermMobileCell>
                <CellLayout label={t('Vesting Period')}>
                  <Text>
                    {vestingPeriod()}
                  </Text>
                </CellLayout>
              </TermMobileCell>
              <DiscountMobileCell>
                <CellLayout label={t('Discount')}>
                  <Text>
                    {`${Math.round(props.discount * 100000) / 1000}%`}
                  </Text>
                </CellLayout>
              </DiscountMobileCell>
              <AprMobileCell>
                <CellLayout label={t('ROI')}>
                  <Roi {...props.roi} hideButton />
                </CellLayout>
              </AprMobileCell>

              <CellInner>
                <CellLayout>
                  <Details actionPanelToggled={actionPanelExpanded} />
                </CellLayout>
              </CellInner>
            </tr>
          </td>
        </Flex>
      </StyledTr >
    )
  }

  return (
    <>
      {handleRenderRow()}
      {shouldRenderChild && (
        <tr>
          <td colSpan={6}>
            <ActionPanel {...props} expanded={actionPanelExpanded} />
          </td>
        </tr>
      )}
    </>
  )
}

export default Row
