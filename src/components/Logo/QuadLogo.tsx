import { Currency } from '@requiemswap/sdk'
import { AutoColumn } from 'components/Column'
import React from 'react'
import styled from 'styled-components'
import CurrencyLogo from './CurrencyLogo'

const Wrapper = styled.div<{ margin: boolean }>`
  display: flex;
  flex-direction: row;
  margin-right: ${({ margin }) => margin && '4px'}
  aspect-ratio: 1;
`

interface QuadCurrencyLogoProps {
  margin?: boolean
  size?: number
  chainId?: number
  currency0?: Currency
  currency1?: Currency
  currency2?: Currency
  currency3?: Currency
}

export default function QuadCurrencyLogo({
  chainId = 56,
  currency0,
  currency1,
  currency2,
  currency3,
  size = 20,
  margin = false,
}: QuadCurrencyLogoProps) {
  return (
    <AutoColumn>
      <Wrapper margin={margin}>
        {currency0 && <CurrencyLogo chainId={chainId} currency={currency0} size={`${size.toString()}px`} style={{ marginRight: '2px' }} />}
        {currency1 && <CurrencyLogo chainId={chainId} currency={currency1} size={`${size.toString()}px`} />}
      </Wrapper>
      <Wrapper margin={margin}>
        {currency2 && <CurrencyLogo chainId={chainId} currency={currency2} size={`${size.toString()}px`} style={{ marginRight: '2px' }} />}
        {currency3 && <CurrencyLogo chainId={chainId} currency={currency3} size={`${size.toString()}px`} />}
      </Wrapper>
    </AutoColumn>
  )
}
