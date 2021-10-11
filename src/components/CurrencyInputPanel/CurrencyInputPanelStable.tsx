/* eslint react/jsx-boolean-value: 0 */
import React from 'react'
import { Currency, Pair } from '@pancakeswap/sdk'
import { Button, ChevronDownIcon, Text, useModal, Flex } from '@pancakeswap/uikit'
import styled from 'styled-components'
import { useTranslation } from 'contexts/Localization'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import { CurrencyLogo, DoubleCurrencyLogo } from '../Logo'

import { RowBetween } from '../Layout/Row'
import { Input as NumericalInput } from './NumericalInput'

const InputRow = styled.div<{ selected: boolean }>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`
const CurrencySelectButton = styled(Button).attrs({ variant: 'text', scale: 'sm' })`
  padding: 0 0.5rem;
`
const LabelRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
`
const InputPanel = styled.div<{ hideInput?: boolean }>`
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 1;
`
const Container = styled.div<{ hideInput: boolean }>`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.input};
  box-shadow: ${({ theme }) => theme.shadows.inset};
`
interface CurrencyInputPanelStable {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  label?: string
  stableCurrency: Currency
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  id: string
  showCommonBases?: boolean
}
export default function CurrencyInputPanelStable({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  label,
  stableCurrency,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  id,
}: CurrencyInputPanelStable) {
  const { account, chainId } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(chainId, account ?? undefined, stableCurrency ?? undefined)
  const { t } = useTranslation()

  return (
    <InputPanel id={id}>
      <Container hideInput={hideInput}>
        {!hideInput && (
          <LabelRow>
            {account && (
              <Text onClick={onMax} fontSize="14px" style={{ display: 'inline', cursor: 'pointer' }}>
                {!hideBalance && !!stableCurrency && selectedCurrencyBalance
                  ? t('Balance: %amount%', { amount: selectedCurrencyBalance?.toSignificant(6) ?? '' })
                  : ' -'}
              </Text>
            )}
          </LabelRow>
        )}
        <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} selected={true}>
          {!hideInput && (
            <>
              <NumericalInput
                className="token-amount-input"
                value={value}
                onUserInput={(val) => {
                  onUserInput(val)
                }}
              />
              {account && stableCurrency && showMaxButton && label !== 'To' && (
                <Button onClick={onMax} scale="sm" variant="text">
                  MAX
                </Button>
              )}
            </>
          )}

          <Flex alignItems="center" justifyContent="space-between">
            {pair ? (
              <DoubleCurrencyLogo chainId={chainId} currency0={pair.token0} currency1={pair.token1} size={16} margin />
            ) : stableCurrency ? (
              <CurrencyLogo chainId={chainId} currency={stableCurrency} size="24px" style={{ marginRight: '8px' }} />
            ) : null}
            {pair ? (
              <Text id="pair">
                {pair?.token0.symbol}:{pair?.token1.symbol}
              </Text>
            ) : (
              <Text id="pair">
                {(stableCurrency && stableCurrency.symbol && stableCurrency.symbol.length > 20
                  ? `${stableCurrency.symbol.slice(0, 4)}...${stableCurrency.symbol.slice(
                    stableCurrency.symbol.length - 5,
                    stableCurrency.symbol.length,
                  )}`
                  : stableCurrency?.symbol) || t('Select a currency')}
              </Text>
            )}
          </Flex>
        </InputRow>
      </Container>
    </InputPanel>
  )
}
