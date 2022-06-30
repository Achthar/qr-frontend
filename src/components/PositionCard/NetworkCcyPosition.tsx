import React, { useState } from 'react'
import { CurrencyAmount, Percent } from '@requiemswap/sdk'
import {
  Button,
  Text,
  ChevronUpIcon,
  ChevronDownIcon,
  Card,
  CardBody,
  Flex,
  CardProps,
  AddIcon,
} from '@requiemswap/uikit'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { BigNumber } from 'ethers'
import { LightCard } from '../Card'
import { AutoColumn } from '../Layout/Column'
import CurrencyLogo from '../Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from '../Logo'
import { RowBetween, RowFixed } from '../Layout/Row'
import { BIG_INT_ZERO } from '../../config/constants'
import Dots from '../Loader/Dots'

const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

interface CurrencyPositionCardProps extends CardProps {
  chainId: number
  currencyAmount: CurrencyAmount
  gap: string,
  padding: string | number,
  showSymbol: boolean
}

function formatAmount(currencyAmount?: CurrencyAmount) {
  return currencyAmount && (
    Number(currencyAmount?.toSignificant(6)) > 1e6 ?
      `${String(Math.round(Number(currencyAmount?.toSignificant(6)) / 1e5) / 10)}M`
      : Number(currencyAmount?.toSignificant(6)) > 1e3 ?
        `${String(Math.round(Number(currencyAmount?.toSignificant(6)) / 1e2) / 10)}K`
        : Number(currencyAmount?.toSignificant(6)) > 1e2 ?
          `${String(Math.round(Number(currencyAmount?.toSignificant(6)) * 10) / 10)}`
          : Number(currencyAmount?.toSignificant(6)) > 1e-2 ?
            `${String(Math.round(Number(currencyAmount?.toSignificant(6)) * 1000) / 1000)}`
            : currencyAmount?.toSignificant(6)) // .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export default function CurrencyPositionCard({ chainId, currencyAmount, gap, padding, showSymbol, ...props }: CurrencyPositionCardProps,) {
  return (
    <Card style={{ borderRadius: '12px' }} {...props}>
      <AutoColumn gap={gap} style={{ padding }}>
        <FixedHeightRow>
          <RowFixed>
            <CurrencyLogo chainId={chainId} size="20px" currency={currencyAmount.currency} />
            {showSymbol &&
              (<Text ml="6px">
                {currencyAmount?.currency?.symbol}
              </Text>)}
          </RowFixed>
          {currencyAmount ? (
            <RowFixed>
              <Text ml="6px">
                {formatAmount(currencyAmount)}
              </Text>
            </RowFixed>
          ) : (
            '-'
          )}
        </FixedHeightRow>
      </AutoColumn>
    </Card>
  )
}
