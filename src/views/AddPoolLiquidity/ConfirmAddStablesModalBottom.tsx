import { Currency, CurrencyAmount, Fraction, Percent } from '@requiemswap/sdk'
import React from 'react'
import { Button, Text } from '@requiemswap/uikit'
import { useTranslation } from 'contexts/Localization'
import { RowBetween, RowFixed } from '../../components/Layout/Row'
import { CurrencyLogo } from '../../components/Logo'
import { StablesField } from '../../state/mintStables/actions'

function ConfirmAddToPoolModalBottom({
  chainId,
  price,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onStablesAdd,
}: {
  chainId: number,
  noLiquidity?: boolean
  price?: Fraction
  currencies: Currency[]
  parsedAmounts: CurrencyAmount[]
  poolTokenPercentage?: Percent
  onStablesAdd: () => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <RowBetween>
        <Text>{t('%asset% Deposited', { asset: currencies[StablesField.CURRENCY_1]?.symbol })}</Text>
        <RowFixed>
          <CurrencyLogo chainId={chainId} currency={currencies[StablesField.CURRENCY_1]} style={{ marginRight: '8px' }} />
          <Text>{parsedAmounts[StablesField.CURRENCY_1]?.toSignificant(6)}</Text>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <Text>{t('%asset% Deposited', { asset: currencies[StablesField.CURRENCY_2]?.symbol })}</Text>
        <RowFixed>
          <CurrencyLogo chainId={chainId} currency={currencies[StablesField.CURRENCY_2]} style={{ marginRight: '8px' }} />
          <Text>{parsedAmounts[StablesField.CURRENCY_2]?.toSignificant(6)}</Text>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <Text>{t('Rates')}</Text>
        <Text>
          {`1 ${currencies[StablesField.CURRENCY_1]?.symbol} = ${price?.toSignificant(4)} ${currencies[StablesField.CURRENCY_2]?.symbol
            }`}
        </Text>
      </RowBetween>
      <RowBetween style={{ justifyContent: 'flex-end' }}>
        <Text>
          {`1 ${currencies[StablesField.CURRENCY_2]?.symbol} = ${price?.invert().toSignificant(4)} ${currencies[StablesField.CURRENCY_1]?.symbol
            }`}
        </Text>
      </RowBetween>
      <RowBetween>
        <Text>{t('Share of Pool')}:</Text>
        <Text>{poolTokenPercentage?.toSignificant(4)}%</Text>
      </RowBetween>
      <Button onClick={onStablesAdd} mt="20px">
        {t('Confirm Supply')}
      </Button>
    </>
  )
}

export default ConfirmAddToPoolModalBottom
