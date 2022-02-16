import { Currency,  Token, NETWORK_CCY } from '@requiemswap/sdk'
import { BinanceIcon } from '@requiemswap/uikit'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import useHttpLocations from '../../hooks/useHttpLocations'
import { WrappedTokenInfo } from '../../state/lists/hooks'
import { getTokenLogoURL, getTokenLogoURLFromSymbol } from '../../utils/getTokenLogoURL'
import Logo from './Logo'

const StyledLogo = styled(Logo) <{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`

export default function CurrencyLogo({
  chainId,
  currency,
  size = '24px',
  style,
}: {
  chainId?: number
  currency?: Currency
  size?: string
  style?: React.CSSProperties
}) {
  const uriLocations = useHttpLocations(56, currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)

  const srcs: string[] = useMemo(() => {
    if (currency === NETWORK_CCY[chainId]) return []

    if (currency instanceof Token) {
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, getTokenLogoURLFromSymbol(currency.symbol)]
      }
      return [getTokenLogoURLFromSymbol(currency.symbol)]
    }
    return []
  }, [chainId, currency, uriLocations])

  if (currency === NETWORK_CCY[chainId]) {
    if (chainId === 56 || chainId === 97) {
      return <BinanceIcon width={size} style={style} />
    }
    if (chainId === 137 || chainId === 80001) {
      return <StyledLogo size={size} srcs={["https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/tokens/WMATIC.svg"]} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
    }
    if (chainId === 43114 || chainId === 43113) {
      return <StyledLogo size={size} srcs={["https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/tokens/AVAX.svg"]} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
    }
    if (chainId === 42261 || chainId === 42261) {
      return <StyledLogo size={size} srcs={["https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/networks/ROSE.svg"]} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
    }
    return <BinanceIcon width={size} style={style} />

  }

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
}
