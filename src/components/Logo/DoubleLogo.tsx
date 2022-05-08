import { Currency } from '@requiemswap/sdk'
import React from 'react'
import styled from 'styled-components'
import CurrencyLogo from './CurrencyLogo'

const Wrapper = styled.div<{ margin: boolean }>`
  display: flex;
  flex-direction: row;
  margin-right: ${({ margin }) => margin && '4px'};
`

interface DoubleCurrencyLogoProps {
  margin?: boolean
  size?: number
  chainId?: number
  currency0?: Currency
  currency1?: Currency
  overlap?: string
}

export default function DoubleCurrencyLogo({
  chainId = 56,
  currency0,
  currency1,
  size = 20,
  margin = false,
  overlap = '-7px'
}: DoubleCurrencyLogoProps) {
  return (
    <Wrapper margin={margin}>
      {currency0 && <CurrencyLogo chainId={chainId} currency={currency0} size={`${size.toString()}px`} style={{ marginRight: '4px' }} />}
      {currency1 && <CurrencyLogo chainId={chainId} currency={currency1} size={`${size.toString()}px`} style={{ marginLeft: overlap }} />}
    </Wrapper>
  )
}
