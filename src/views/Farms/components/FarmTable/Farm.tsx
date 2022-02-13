import React from 'react'
import styled from 'styled-components'
import { useFarmUser } from 'state/farms/hooks'
import { useTranslation } from 'contexts/Localization'
import { Text } from '@requiemswap/uikit'
// import { Token } from '@requiemswap/sdk'
import { getBalanceNumber } from 'utils/formatBalance'
import { TokenPairImage } from 'components/TokenImage'
import { SerializedToken } from 'config/constants/types'
import { deserializeToken } from 'state/user/hooks/helpers'
import { PoolType } from '@requiemswap/sdk'
import QuadCurrencyLogo from 'components/Logo/QuadLogo'

export interface FarmProps {
  chainId: number
  label: string
  pid: number
  token: SerializedToken
  quoteToken: SerializedToken
  poolType?: PoolType
  token2?: SerializedToken
  token3?: SerializedToken
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

const Farm: React.FunctionComponent<FarmProps> = ({ chainId, token, quoteToken, label, pid, poolType, token2, token3 }) => {
  const { stakedBalance } = useFarmUser(pid)
  const { t } = useTranslation()
  const rawStakedBalance = getBalanceNumber(stakedBalance)

  const handleRenderFarming = (): JSX.Element => {
    if (rawStakedBalance) {
      return (
        <Text color="secondary" fontSize="12px" bold textTransform="uppercase">
          {t('Farming')}
        </Text>
      )
    }

    return null
  }

  return (
    <Container>
      {
        poolType !== PoolType.StablePairWrapper && token && quoteToken ? (
          <TokenWrapper>
            <TokenPairImage variant="inverted" chainId={chainId} primaryToken={deserializeToken(token)} secondaryToken={deserializeToken(quoteToken)} width={40} height={40} />
          </TokenWrapper>)
          : token2 && token3 && (
            <TokenWrapper>
              <QuadCurrencyLogo
                currency0={deserializeToken(token)}
                currency1={deserializeToken(quoteToken)}
                currency2={deserializeToken(token2)}
                currency3={deserializeToken(token3)}
                size={10}
                margin
              />
            </TokenWrapper>
          )
      }
      <div>
        {handleRenderFarming()}

        <Text bold>{label}</Text>
      </div>
    </Container>
  )
}

export default Farm
