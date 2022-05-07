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
import { useWeb3React } from '@web3-react/core'
import { useCombinedActiveList } from '../../state/lists/hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { useIsUserAddedToken, useAllInactiveTokens } from '../../hooks/Tokens'
import Column from '../Layout/Column'
import { RowFixed, RowBetween } from '../Layout/Row'
import { CurrencyLogo } from '../Logo'
import CircleLoader from '../Loader/CircleLoader'
import { isTokenOnList } from '../../utils'
import ImportRow from './ImportRow'

function currencyKey(currency: Token): string {
  return currency.address
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
  return <StyledBalanceText title={balance.toExact()}>{Number(balance.toSignificant(4)).toLocaleString()}</StyledBalanceText>
}

const MenuItem = styled(RowBetween) <{ disabled: boolean; selected: boolean }>`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-template-columns: auto minmax(auto, 1fr) minmax(0, 72px);
  grid-gap: 8px;
  z-index:100;
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
  :hover {
    background-color: ${({ theme, disabled }) => !disabled && theme.colors.background};
  }
  opacity: ${({ disabled, selected }) => (disabled || selected ? 0.5 : 1)};
`

function TokenRow({
  account,
  currency,
  onSelect,
  isSelected,
  otherSelected,
  style,
}: {
  account: string
  currency: Token
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
  style: CSSProperties
}) {
  const chainId = currency?.chainId
  const key = currencyKey(currency)
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

export default function TokenList({
  account,
  currencies,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,
  breakIndex,
}: {
  account: string
  currencies: Token[]
  selectedCurrency?: Token | null
  onCurrencySelect: (currency: Token) => void
  otherCurrency?: Token | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  breakIndex: number | undefined
}) {

  const itemData: (Token | undefined)[] = currencies

  const Row = useCallback(
    ({ data, index, style }) => {
      const currency: Token = data[index]
      const isSelected = Boolean(selectedCurrency && currencyEquals(selectedCurrency, currency))
      const otherSelected = Boolean(otherCurrency && currencyEquals(otherCurrency, currency))
      const handleSelect = () => onCurrencySelect(currency)

      return (
        <TokenRow
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
      onCurrencySelect,
      otherCurrency,
      selectedCurrency,
      account
    ],
  )

  const itemKey = useCallback((index: number, data: any) => currencyKey(data[index]), [])

  return (
    <FixedSizeList
      height={56 * itemData.length}
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
