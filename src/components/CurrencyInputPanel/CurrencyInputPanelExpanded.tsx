import React from 'react'
import { Currency, AmplifiedWeightedPair, TokenAmount, CurrencyAmount, Token } from '@requiemswap/sdk'
import { Button, ChevronDownIcon, Text, useModal, Flex, UserMenuDivider } from '@requiemswap/uikit'
import styled from 'styled-components'
import { useTranslation } from 'contexts/Localization'
import CircleLoader from 'components/Loader/CircleLoader'
import { RowBetween } from '../Layout/Row'
import { Input as NumericalInput } from './NumericalInput'
import CurrencySearchModalExpanded from '../SearchModal/CurrencySearchModalExpanded'
import { CurrencyLogo, DoubleCurrencyLogo } from '../Logo'

const Line = styled.hr`
  height: 1px;
  border:  none;
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  color: white;
  width: 90%;
  size: 0.1;
`;

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
const InputPanel = styled.div<{ hideInput?: boolean, width: string }>`
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 1;
  width: ${(props) => props.width};
`
const Container = styled.div<{ hideInput: boolean, borderRadius: string }>`
  border-radius: ${(props) => props.borderRadius};
  background-color: ${({ theme }) => theme.colors.input};
  box-shadow: ${({ theme }) => theme.shadows.inset};
`
interface CurrencyInputPanelExpandedProps {
  reducedLine?: boolean
  balanceText?: string
  borderRadius?: string
  width?: string
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  balances: { [address: string]: TokenAmount }
  networkCcyBalance?: CurrencyAmount
  isLoading: boolean
  chainId: number
  account: string
  showMaxButton: boolean
  label?: string
  onCurrencySelect: (currency: Currency) => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  pair?: AmplifiedWeightedPair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  id: string
  showCommonBases?: boolean
}
export default function CurrencyInputPanelExpanded({
  reducedLine = false,
  balanceText = 'Balance',
  borderRadius = '16px',
  width = '100%',
  value,
  onUserInput,
  onMax,
  balances,
  networkCcyBalance,
  isLoading,
  chainId,
  account,
  showMaxButton,
  label,
  onCurrencySelect,
  currency,
  disableCurrencySelect = false,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  otherCurrency,
  id,
  showCommonBases,
}: CurrencyInputPanelExpandedProps) {

  // select based on whether ccy is token, if not it has to be the network ccy
  const selectedCurrencyBalance = currency instanceof Token ? balances[currency.address] : networkCcyBalance // useCurrencyBalance(chainId, account ?? undefined, currency ?? undefined)
  const { t } = useTranslation()
  const translatedLabel = label || t('Input')

  const [onPresentCurrencyModal] = useModal(
    <CurrencySearchModalExpanded
      chainId={chainId}
      account={account}
      networkCcyAmount={networkCcyBalance}
      tokenAmounts={Object.values(balances)}
      isLoading={isLoading}
      onCurrencySelect={onCurrencySelect}
      selectedCurrency={currency}
      otherSelectedCurrency={otherCurrency}
      showCommonBases={showCommonBases}
    />,
  )
  return (
    <InputPanel id={id} width={width} >
      <Container hideInput={hideInput} borderRadius={borderRadius}>
        {(!hideInput || reducedLine) && (
          <>
            <LabelRow>
              <RowBetween>
                <Text fontSize="14px">{translatedLabel}</Text>
                {account && (
                  <Text onClick={onMax} fontSize="14px" style={{ display: 'inline', cursor: 'pointer' }}>
                    {!hideBalance && !!currency && selectedCurrencyBalance
                      ? isLoading ? <CircleLoader /> : `${balanceText}: ${Number(selectedCurrencyBalance?.toSignificant(8)).toLocaleString() ?? '' }`
                      : ' -'}
                  </Text>
                )}
              </RowBetween>

            </LabelRow>
            <Line />
          </>
        )}

        <InputRow style={hideInput ? reducedLine ?
          { padding: '0', borderRadius: '8px', marginLeft: '35%' }
          : { padding: '0', borderRadius: '8px' } : {}} selected={disableCurrencySelect}>
          {!hideInput && (
            <>
              <NumericalInput
                className="token-amount-input"
                value={value}
                onUserInput={(val) => {
                  onUserInput(val)
                }}
              />
              {account && currency && showMaxButton && label !== 'To' && (
                <Button onClick={onMax} scale="sm" variant="text">
                  MAX
                </Button>
              )}
            </>
          )}
          <CurrencySelectButton
            selected={!!currency}
            className="open-currency-select-button"
            onClick={() => {
              if (!disableCurrencySelect) {
                onPresentCurrencyModal()
              }
            }}
          >
            <Flex alignItems="center" justifyContent="space-between">
              {pair ? (
                <DoubleCurrencyLogo chainId={chainId} currency0={pair.token0} currency1={pair.token1} size={16} margin />
              ) : currency ? (
                <CurrencyLogo chainId={chainId} currency={currency} size="24px" style={{ marginRight: '8px' }} />
              ) : null}
              {pair ? (
                <Text id="pair">
                  {pair?.token0.symbol}:{pair?.token1.symbol}
                </Text>
              ) : (
                <Text id="pair">
                  {(currency && currency.symbol && currency.symbol.length > 20
                    ? `${currency.symbol.slice(0, 4)}...${currency.symbol.slice(
                      currency.symbol.length - 5,
                      currency.symbol.length,
                    )}`
                    : currency?.symbol) || t('Select a currency')}
                </Text>
              )}
              {!disableCurrencySelect && <ChevronDownIcon />}
            </Flex>
          </CurrencySelectButton>
        </InputRow>
      </Container>
    </InputPanel>
  )
}
