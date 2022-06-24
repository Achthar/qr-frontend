import React from 'react'
import styled from 'styled-components'
import { useBondUser } from 'state/bonds/hooks'
import { useTranslation } from 'contexts/Localization'
import { Text, useMatchBreakpoints } from '@requiemswap/uikit'
import { getBalanceNumber } from 'utils/formatBalance'
import { BondAssetType, SerializedToken } from 'config/constants/types'
import { deserializeToken, serializeToken } from 'state/user/hooks/helpers'
import PoolLogo from 'components/Logo/PoolLogo'

export interface BondProps {
  label: string
  bondId: number
  bondType: BondAssetType
  tokens: SerializedToken[]
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

const Bond: React.FunctionComponent<BondProps> = ({ label, bondId, tokens }) => {
  const { stakedBalance } = useBondUser(bondId)
  const { t } = useTranslation()
  const rawStakedBalance = getBalanceNumber(stakedBalance)
  const { isDesktop, isMobile } = useMatchBreakpoints()
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
        <PoolLogo tokens={tokens.map(tok => deserializeToken(tok))} size={25} overlap='-3px' />
      </TokenWrapper>
      <div style={{ marginLeft: 25 }}>
        {handleRenderBonding()}
        <Text bold fontSize={isMobile ? '1' : '2'}>{label}</Text>
      </div>
    </Container>
  )
}

export default Bond
