import React from 'react'
import styled from 'styled-components'
import { useBondUser } from 'state/bonds/hooks'
import { useTranslation } from 'contexts/Localization'
import { Text } from '@requiemswap/uikit'
import { getBalanceNumber } from 'utils/formatBalance'
import { SerializedToken } from 'config/constants/types'
import { TokenPairImage } from 'components/TokenImage'
import { deserializeToken, serializeToken } from 'state/user/hooks/helpers'
import { DoubleCurrencyLogo } from 'components/Logo'

export interface BondProps {
  label: string
  bondId: number
  token: SerializedToken
  quoteToken: SerializedToken
}

const Container = styled.div`
  padding-left: 16px;
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-left: 32px;
  }
`

const TokenWrapper = styled.div`
  padding-right: 8px;
  width: 24px;

  ${({ theme }) => theme.mediaQueries.sm} {
    width: 40px;
  }
`

const Bond: React.FunctionComponent<BondProps> = ({ token, quoteToken, label, bondId }) => {
  const { stakedBalance } = useBondUser(bondId)
  const { t } = useTranslation()
  const rawStakedBalance = getBalanceNumber(stakedBalance)

  const handleRenderBonding = (): JSX.Element => {
    if (rawStakedBalance) {
      return (
        <Text color="secondary" fontSize="12px" bold textTransform="uppercase">
          {t('Bonding')}
        </Text>
      )
    }

    return null
  }


  return (
    <Container>
      {
        token && quoteToken && (
          <TokenWrapper>
            <DoubleCurrencyLogo currency0={deserializeToken(token)} currency1={deserializeToken(quoteToken)} size={30} margin />
          </TokenWrapper>)
      }
      <div style={{ marginLeft: 40 }}>
        {handleRenderBonding()}
        <Text bold>{label}</Text>
      </div>
    </Container>
  )
}

export default Bond
