import React from 'react'
import styled from 'styled-components'
import { useBondUser } from 'state/bonds/hooks'
import { useTranslation } from 'contexts/Localization'
import { Text, useMatchBreakpoints } from '@requiemswap/uikit'
import { getBalanceNumber } from 'utils/formatBalance'
import { BondType, SerializedToken } from 'config/constants/types'
import { TokenPairImage } from 'components/TokenImage'
import { deserializeToken, serializeToken } from 'state/user/hooks/helpers'
import { DoubleCurrencyLogo } from 'components/Logo'
import QuadCurrencyLogo from 'components/Logo/QuadLogo'

export interface BondProps {
  label: string
  bondId: number
  bondType: BondType
  token: SerializedToken
  quoteToken: SerializedToken
  token2?: SerializedToken
  token3?: SerializedToken
}

const Container = styled.div`
  padding-left: 16px;
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-left: 26px;
  }
`

const TokenWrapper = styled.div`
  padding-right: 8px;
  width: 48px;

  ${({ theme }) => theme.mediaQueries.sm} {
    width: 40px;
  }
`

const BondMobile: React.FunctionComponent<BondProps> = ({ token, quoteToken, label, bondId, token2, token3, bondType }) => {

  return (
    <Container>
      {
        bondType === BondType.PairLP && token && quoteToken ? (
          <TokenWrapper>
            <DoubleCurrencyLogo currency0={deserializeToken(token)} currency1={deserializeToken(quoteToken)} size={24} margin />
          </TokenWrapper>)
          : token2 && token3 && (
            <TokenWrapper>
              <QuadCurrencyLogo
                currency0={deserializeToken(token)}
                currency1={deserializeToken(quoteToken)}
                currency2={deserializeToken(token2)}
                currency3={deserializeToken(token3)}
                size={24}
                margin
              />
            </TokenWrapper>
          )
      }
    </Container>
  )
}

export default BondMobile
