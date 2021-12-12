import { Currency, CurrencyAmount, Fraction, Percent } from '@requiemswap/sdk'
import React from 'react'
import { Button, Text } from '@requiemswap/uikit'
import { useTranslation } from 'contexts/Localization'
import { RowBetween, RowFixed } from '../../components/Layout/Row'
import { CurrencyLogo } from '../../components/Logo'
import { WeightedField } from '../../state/mintWeightedPair/actions'

function ConfirmAddModalBottom({
  chainId,
  noLiquidity,
  price,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onAdd,
}: {
  chainId: number,
  noLiquidity?: boolean
  price?: Fraction
  currencies: { [field in WeightedField]?: Currency }
  parsedAmounts: { [field in WeightedField]?: CurrencyAmount }
  poolTokenPercentage?: Percent
  onAdd: () => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <RowBetween>
        <Text>{t('%asset% Deposited', { asset: currencies[WeightedField.CURRENCY_A]?.symbol })}</Text>
        <RowFixed>
          <CurrencyLogo chainId={chainId} currency={currencies[WeightedField.CURRENCY_A]} style={{ marginRight: '8px' }} />
          <Text>{parsedAmounts[WeightedField.CURRENCY_A]?.toSignificant(6)}</Text>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <Text>{t('%asset% Deposited', { asset: currencies[WeightedField.CURRENCY_B]?.symbol })}</Text>
        <RowFixed>
          <CurrencyLogo chainId={chainId} currency={currencies[WeightedField.CURRENCY_B]} style={{ marginRight: '8px' }} />
          <Text>{parsedAmounts[WeightedField.CURRENCY_B]?.toSignificant(6)}</Text>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <Text>{t('Rates')}</Text>
        <Text>
          {`1 ${currencies[WeightedField.CURRENCY_A]?.symbol} = ${price?.toSignificant(4)} ${currencies[WeightedField.CURRENCY_B]?.symbol
            }`}
        </Text>
      </RowBetween>
      <RowBetween style={{ justifyContent: 'flex-end' }}>
        <Text>
          {`1 ${currencies[WeightedField.CURRENCY_B]?.symbol} = ${price?.invert().toSignificant(4)} ${currencies[WeightedField.CURRENCY_A]?.symbol
            }`}
        </Text>
      </RowBetween>
      <RowBetween>
        <Text>{t('Share of Pool')}:</Text>
        <Text>{noLiquidity ? '100' : poolTokenPercentage?.toSignificant(4)}%</Text>
      </RowBetween>
      <Button onClick={onAdd} mt="20px">
        {noLiquidity ? t('Create Pool & Supply') : t('Confirm Supply')}
      </Button>
    </>
  )
}

export default ConfirmAddModalBottom
