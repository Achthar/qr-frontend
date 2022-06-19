import React, { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { Currency, CurrencyAmount, currencyEquals, Token, NETWORK_CCY, TokenAmount } from '@requiemswap/sdk'
import { Text } from '@requiemswap/uikit'
import styled from 'styled-components'
import { FixedSizeList } from 'react-window'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { LightGreyCard } from 'components/Card'
import QuestionHelper from 'components/QuestionHelper'
import { useTranslation } from 'contexts/Localization'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { useCombinedActiveList } from '../../state/lists/hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { useIsUserAddedToken, useAllInactiveTokens } from '../../hooks/Tokens'
import Column from '../Layout/Column'
import { RowFixed, RowBetween } from '../Layout/Row'
import { CurrencyLogo } from '../Logo'
import CircleLoader from '../Loader/CircleLoader'
import { isTokenOnList } from '../../utils'
import ImportRow from './ImportRow'

function currencyKey(chainId: number, currency: Currency): string {
  return currency instanceof Token ? currency.address : currency === NETWORK_CCY[chainId ?? 43113] ? NETWORK_CCY[chainId ?? 43113].symbol : ''
}

const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 5rem;
  text-overflow: ellipsis;
`

const FixedContentRow = styled.div`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-gap: 16px;
  align-items: center;
`

function Balance({ balance }: { balance: CurrencyAmount }) {
  return <StyledBalanceText title={balance.toExact()}>{balance.toSignificant(4)}</StyledBalanceText>
}

const MenuItem = styled(RowBetween) <{ disabled: boolean; selected: boolean }>`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-template-columns: auto minmax(auto, 1fr) minmax(0, 72px);
  grid-gap: 8px;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
  :hover {
    background-color: ${({ theme, disabled }) => !disabled && theme.colors.background};
  }
  opacity: ${({ disabled, selected }) => (disabled || selected ? 0.5 : 1)};
`

function CurrencyRowExpanded({
  chainId,
  account,
  currencyAmount,
  isLoading,
  onSelect,
  isSelected,
  otherSelected,
  style,
}: {
  chainId: number
  account: string
  currencyAmount: CurrencyAmount
  isLoading: boolean
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
  style: CSSProperties
}) {
  const key = currencyKey(chainId, currencyAmount.currency)
  const selectedTokenList = useCombinedActiveList(chainId)
  const isOnSelectedList = isTokenOnList(chainId, selectedTokenList, currencyAmount.currency)
  const customAdded = useIsUserAddedToken(currencyAmount.currency)
  // const balance = useCurrencyBalance(chainId, account ?? undefined, currencyAmount.currency)

  // only show add or remove buttons if not on selected list
  return (
    <MenuItem
      style={style}
      className={`token-item-${key}`}
      onClick={() => (isSelected ? null : onSelect())}
      disabled={isSelected}
      selected={otherSelected}
    >
      <CurrencyLogo chainId={chainId} currency={currencyAmount.currency} size="24px" />
      <Column>
        <Text bold>{currencyAmount?.currency?.symbol}</Text>
        <Text color="textSubtle" small ellipsis maxWidth="200px">
          {!isOnSelectedList && customAdded && 'Added by user •'} {currencyAmount.currency?.name}
        </Text>
      </Column>
      <RowFixed style={{ justifySelf: 'flex-end' }}>
        {!isLoading ? <Balance balance={currencyAmount} /> : account ? <CircleLoader /> : null}
      </RowFixed>
    </MenuItem>
  )
}

export default function CurrencyListExpanded({
  height,
  networkCcyAmount,
  tokenAmounts,
  isLoading,
  chainId,
  account,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,
  showETH,
  showImportView,
  setImportToken,
  breakIndex,
}: {
  height: number
  networkCcyAmount: CurrencyAmount
  tokenAmounts: TokenAmount[]
  isLoading: boolean
  chainId: number
  account: string
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showETH: boolean
  showImportView: () => void
  setImportToken: (token: Token) => void
  breakIndex: number | undefined
}) {

  const itemData: (CurrencyAmount | undefined)[] = useMemo(() => {
    let formatted: (CurrencyAmount | undefined)[] = showETH ? [networkCcyAmount, ...tokenAmounts] : tokenAmounts
    if (breakIndex !== undefined) {
      formatted = [...formatted.slice(0, breakIndex), undefined, ...formatted.slice(breakIndex, formatted.length)]
    }
    return formatted
  }, [breakIndex, tokenAmounts, showETH, networkCcyAmount])


  const { t } = useTranslation()

  const inactiveTokens: {
    [address: string]: Token
  } = useAllInactiveTokens(chainId)

  const Row = useCallback(
    ({ data, index, style }) => {
      const currencyAmount: CurrencyAmount = data[index]
      const isSelected = Boolean(selectedCurrency && currencyEquals(selectedCurrency, currencyAmount?.currency))
      const otherSelected = Boolean(otherCurrency && currencyEquals(otherCurrency, currencyAmount?.currency))
      const handleSelect = () => onCurrencySelect(currencyAmount.currency)

      const token = wrappedCurrency(currencyAmount?.currency, chainId)

      const showImport = inactiveTokens && token && Object.keys(inactiveTokens).includes(token.address)

      if (index === breakIndex || !data) {
        return (
          <FixedContentRow style={style}>
            <LightGreyCard padding="8px 12px" borderRadius="8px">
              <RowBetween>
                <Text small>{t('Expanded results from inactive Token Lists')}</Text>
                <QuestionHelper
                  text={t(
                    "Tokens from inactive lists. Import specific tokens below or click 'Manage' to activate more lists.",
                  )}
                  ml="4px"
                />
              </RowBetween>
            </LightGreyCard>
          </FixedContentRow>
        )
      }

      if (showImport && token) {
        return (
          <ImportRow style={style} token={token} showImportView={showImportView} setImportToken={setImportToken} dim />
        )
      }
      return (
        <CurrencyRowExpanded
          chainId={chainId}
          account={account}
          style={style}
          currencyAmount={currencyAmount}
          isLoading={isLoading}
          isSelected={isSelected}
          onSelect={handleSelect}
          otherSelected={otherSelected}
        />
      )
    },
    [
      chainId,
      inactiveTokens,
      onCurrencySelect,
      otherCurrency,
      selectedCurrency,
      setImportToken,
      showImportView,
      breakIndex,
      t,
      account,
      isLoading
    ],
  )

  const itemKey = useCallback((index: number, data: any) => currencyKey(chainId, data[index]), [chainId])

  return (
    <FixedSizeList
      height={height}
      ref={fixedListRef as any}
      width="100%"
      itemData={itemData}
      itemCount={itemData.length}
      itemSize={56}
      itemKey={itemKey}
    >
      {Row}
    </FixedSizeList>
  )
}
