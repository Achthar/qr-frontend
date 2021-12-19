import React from 'react'
import styled from 'styled-components'
import { useBondUser } from 'state/bonds/hooks'
import { useTranslation } from 'contexts/Localization'
import { Text } from '@requiemswap/uikit'
import { getBalanceNumber } from 'utils/formatBalance'
import { Token } from 'config/constants/types'
import { TokenPairImage } from 'components/TokenImage'

export interface BondProps {
  label: string
  bondId: number
  token: Token
  quoteToken: Token
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
      <TokenWrapper>
        <TokenPairImage
          chainId={56}
          variant="inverted"
          primaryToken={token}
          secondaryToken={quoteToken}
          width={40}
          height={40}
        />
      </TokenWrapper>
      <div>
        {handleRenderBonding()}
        <Text bold>{label}</Text>
      </div>
    </Container>
  )
}

export default Bond