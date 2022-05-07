import React, { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { Currency, CurrencyAmount, currencyEquals, Token, NETWORK_CCY } from '@requiemswap/sdk'
import { Text } from '@requiemswap/uikit'
import styled from 'styled-components'
import { FixedSizeList } from 'react-window'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { LightGreyCard } from 'components/Card'
import QuestionHelper from 'components/QuestionHelper'
import { useTranslation } from 'contexts/Localization'
import { useNetworkState } from 'state/globalNetwork/hooks'
// import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
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

function CurrencyRow({
  chainId,
  account,
  currency,
  onSelect,
  isSelected,
  otherSelected,
  style,
}: {
  chainId: number
  account: string
  currency: Currency
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
  style: CSSProperties
}) {
  const key = currencyKey(chainId, currency)
  const selectedTokenList = useCombinedActiveList(chainId)
  const isOnSelectedList = isTokenOnList(chainId, selectedTokenList, currency)
  const customAdded = useIsUserAddedToken(currency)
  const balance = useCurrencyBalance(chainId, account ?? undefined, currency)

  // only show add or remove buttons if not on selected list
  return (
    <MenuItem
      style={style}
      className={`token-item-${key}`}
      onClick={() => (isSelected ? null : onSelect())}
      disabled={isSelected}
      selected={otherSelected}
    >
      <CurrencyLogo chainId={chainId} currency={currency} size="24px" />
      <Column>
        <Text bold>{currency?.symbol}</Text>
        <Text color="textSubtle" small ellipsis maxWidth="200px">
          {!isOnSelectedList && customAdded && 'Added by user •'} {currency?.name}
        </Text>
      </Column>
      <RowFixed style={{ justifySelf: 'flex-end' }}>
        {balance ? <Balance balance={balance} /> : account ? <CircleLoader /> : null}
      </RowFixed>
    </MenuItem>
  )
}

export default function CurrencyList({
  chainId,
  account,
  height,
  currencies,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,
  showETH,
  showImportView,
  setImportToken,
  breakIndex,
}: {
  chainId: number
  account: string
  height: number
  currencies: Currency[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showETH: boolean
  showImportView: () => void
  setImportToken: (token: Token) => void
  breakIndex: number | undefined
}) {

  const itemData: (Currency | undefined)[] = useMemo(() => {
    let formatted: (Currency | undefined)[] = showETH ? [NETWORK_CCY[chainId], ...currencies] : currencies
    if (breakIndex !== undefined) {
      formatted = [...formatted.slice(0, breakIndex), undefined, ...formatted.slice(breakIndex, formatted.length)]
    }
    return formatted
  }, [chainId, breakIndex, currencies, showETH])


  const { t } = useTranslation()

  const inactiveTokens: {
    [address: string]: Token
  } = useAllInactiveTokens(chainId)

  const Row = useCallback(
    ({ data, index, style }) => {
      const currency: Currency = data[index]
      const isSelected = Boolean(selectedCurrency && currencyEquals(selectedCurrency, currency))
      const otherSelected = Boolean(otherCurrency && currencyEquals(otherCurrency, currency))
      const handleSelect = () => onCurrencySelect(currency)

      const token = wrappedCurrency(currency, chainId)

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
        <CurrencyRow
          chainId={chainId}
          account={account}
          style={style}
          currency={currency}
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
      account
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
