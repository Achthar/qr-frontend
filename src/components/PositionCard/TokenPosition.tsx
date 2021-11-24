import React, { useState } from 'react'
import { JSBI, TokenAmount, Percent } from '@requiemswap/sdk'
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
import { useTranslation } from 'contexts/Localization'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useTotalSupply from '../../hooks/useTotalSupply'

import { useTokenBalance } from '../../state/wallet/hooks'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'

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
              <Text ml="6px">{tokenAmount?.toSignificant(6).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</Text>
            </RowFixed>
          ) : (
            '-'
          )}
        </FixedHeightRow>
      </AutoColumn>
    </Card>
  )
}
