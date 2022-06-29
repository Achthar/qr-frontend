/* eslint react/destructuring-assignment: 0 */

import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { CallBondWithStakedValue, DesktopColumnSchemaCall } from 'views/Bonds/components/types'
import { useMatchBreakpoints, Text, Flex } from '@requiemswap/uikit'
import { useTranslation } from 'contexts/Localization'
import useDelayedUnmount from 'hooks/useDelayedUnmount'
import { useCallBondFromBondId, useBondUser, useCallBondUser } from 'state/bonds/hooks'
import { useBlock } from 'state/block/hooks'
import { prettifySeconds, secondsUntilBlock } from 'config'
import CircleLoader from 'components/Loader/CircleLoader'
import { ethers } from 'ethers'
import Liquidity, { LiquidityProps } from './Liquidity'
import ActionPanel from './Actions/ActionPanel'
import CellLayout from './CellLayout'
import Roi, { RoiProps } from './Roi'
import Apr, { AprProps } from './Apr'
import CallBond, { CallBondProps } from './CallBond'
import Earned, { EarnedProps } from './Earned'
import Details from './Details'
import { DesktopColumnSchema, MobileColumnSchema } from '../types'


interface PurchasedProps {
  purchasedUnits: number
  purchasedInQuote: number
}

interface PriceProps {
  // req price
  reqPrice: number
  // bond price
  price: number
}

export interface CallRowProps {
  bond: CallBondProps
  details: CallBondWithStakedValue
  discount: number
  price: PriceProps
  strike: string
  payout: string
  purchased: PurchasedProps
  term: number
  reqPrice: number
  // prices: PriceProps
}

interface RowPropsWithLoading extends CallRowProps {
  userDataReady: boolean
  isLast: boolean
}

const cells = {
  bond: CallBond,
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


const StyledTr = styled.tr<{ isLast: boolean }>`
  cursor: pointer;
  ${({ isLast }) => !isLast ? `border-bottom: 2px solid #4a4a4a;` : ''}
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
  const { details, userDataReady, isLast } = props
  const hasStakedAmount = !!useCallBondUser(details.bondId).stakedBalance.toNumber()
  const [actionPanelExpanded, setActionPanelExpanded] = useState(hasStakedAmount)
  const shouldRenderChild = useDelayedUnmount(actionPanelExpanded, 300)
  const { t } = useTranslation()

  const bond = useCallBondFromBondId(details.bondId)

  const toggleActionPanel = () => {
    setActionPanelExpanded(!actionPanelExpanded)
  }

  useEffect(() => {
    setActionPanelExpanded(hasStakedAmount)
  }, [hasStakedAmount])

  const { isDesktop, isMobile } = useMatchBreakpoints()

  const isSmallerScreen = !isDesktop
  const tableSchema = isSmallerScreen ? MobileColumnSchema : DesktopColumnSchemaCall
  const columnNames = tableSchema.map((column) => column.name)

  const vesting = () => {
    return prettifySeconds(Number(bond?.bondTerms?.vesting) ?? 0, isMobile ? 'day' : 'hour');
  };

  const loading = useMemo(() => !(props?.price?.price === 0 || props?.discount > -100), [props.price, props.discount])

  const disc = useMemo(() => {
    return props.discount > 0 ? Math.round(props.discount * 10000) / 100 : -Math.round((1 / (1 - props.discount) - 1) * 10000) / 100
  }, [props.discount])

  const handleRenderRow = () => {
    if (!isMobile) {
      return (
        <StyledTr onClick={toggleActionPanel} isLast={isLast}>
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
                      <CellLayout label={props.discount > 0 ? 'Discount' : 'Premium'}>
                        {!loading ? (<Text>
                          {`${disc}%`}
                        </Text>) : <CircleLoader />}
                      </CellLayout>
                    </CellInner>
                  </td>
                )
              case 'price':
                return (
                  <td key={key}>
                    <CellInner>
                      <CellLayout label={t('Price')}>
                        {!loading ? (<Text>
                          {`$${Math.round(props.price.price * 10000) / 10000}`}
                        </Text>) : <CircleLoader />}
                      </CellLayout>
                    </CellInner>
                  </td>
                )
              case 'purchased':
                return (
                  <td key={key}>
                    <CellInner>
                      <CellLayout label={t('Purchased')}>
                        {!loading ? (<Text>
                          {`$${Math.round(props.purchased.purchasedInQuote).toLocaleString()}/${props.purchased.purchasedUnits} units`}
                        </Text>) : <CircleLoader />}
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
                          {vesting()}
                        </Text>
                      </CellLayout>
                    </CellInner>
                  </td>
                )
              case 'strike':
                return (
                  <td key={key}>
                    <CellInner>
                      <CellLayout label={t('Strike')}>
                        {!loading ? (
                          <Text>
                            {Math.round(Number(ethers.utils.formatEther(props.strike)) * 10000) / 100}%
                          </Text>) : <CircleLoader />}
                      </CellLayout>
                    </CellInner>
                  </td>
                )
              case 'payout':
                return (
                  <td key={key}>
                    <CellInner>
                      <CellLayout label={t('Option')}>
                        {!loading ? (
                          <Text>
                            {Math.round(Number(ethers.utils.formatEther(props.payout)) * 10000) / 100}%
                          </Text>) : <CircleLoader />}
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
      <StyledTr onClick={toggleActionPanel} isLast={isLast}>
        <Flex flexDirection="column" mb="8px">
          <tr>
            <BondMobileCell>
              <CellLayout>
                <CallBond {...props.bond} />
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
                <CellLayout label={t('Vesting')}>
                  {!loading ? (<Text fontSize='13px' >
                    {vesting()}
                  </Text>) : <CircleLoader />}
                </CellLayout>
              </TermMobileCell>
              <DiscountMobileCell>
                <CellLayout label={props.discount > 0 ? 'Discount' : 'Premium'}>
                  {!loading ? (<Text fontSize='13px'>
                    {`${disc}%`}
                  </Text>) : <CircleLoader />}
                </CellLayout>
              </DiscountMobileCell>
              <AprMobileCell>
                <CellLayout label={t('Strike')}>
                  {!loading ? (<Text fontSize='13px'>
                    {Math.round(Number(ethers.utils.formatEther(props.strike)) * 10000) / 100}%
                  </Text>) : <CircleLoader />}
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
