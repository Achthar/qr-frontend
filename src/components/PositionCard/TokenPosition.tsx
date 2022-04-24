import React, { useState } from 'react'
import { TokenAmount, Percent } from '@requiemswap/sdk'
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

interface TokenPositionCardProps extends CardProps {
  tokenAmount: TokenAmount
  gap: string,
  padding: string | number,
  showSymbol: boolean
}

function formatAmount(tokenAmount?: TokenAmount) {
  return tokenAmount && (
    Number(tokenAmount?.toSignificant(6)) > 1e6 ?
      `${String(Math.round(Number(tokenAmount?.toSignificant(6)) / 1e5) / 10)}M`
      : Number(tokenAmount?.toSignificant(6)) > 1e3 ?
        `${String(Math.round(Number(tokenAmount?.toSignificant(6)) / 1e2) / 10)}K`
        : Number(tokenAmount?.toSignificant(6)) > 1e2 ?
          `${String(Math.round(Number(tokenAmount?.toSignificant(6)) * 10) / 10)}`
          : Number(tokenAmount?.toSignificant(6)) > 1e-2 ?
            `${String(Math.round(Number(tokenAmount?.toSignificant(6)) * 1000) / 1000)}`
            : tokenAmount?.toSignificant(6)) // .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export default function TokenPositionCard({ tokenAmount, gap, padding, showSymbol, ...props }: TokenPositionCardProps,) {

  return (
    <Card style={{ borderRadius: '12px' }} {...props}>
      <AutoColumn gap={gap} style={{ padding }}>
        <FixedHeightRow>
          <RowFixed>
            <CurrencyLogo chainId={tokenAmount.token.chainId} size="20px" currency={tokenAmount.token} />
            {showSymbol &&
              (<Text ml="6px">
                {tokenAmount?.token.symbol}
              </Text>)}
          </RowFixed>
          {tokenAmount ? (
            <RowFixed>
              <Text ml="6px">
                {formatAmount(tokenAmount)}
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
