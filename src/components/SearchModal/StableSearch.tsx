import React, { KeyboardEvent, RefObject, useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { Currency, Token, NETWORK_CCY, STABLES_INDEX_MAP, STABLECOINS } from '@requiemswap/sdk'
import { Text, Input, Box } from '@requiemswap/uikit'
import { useTranslation } from 'contexts/Localization'
import { FixedSizeList } from 'react-window'
import { useAudioModeManager } from 'state/user/hooks'
import useDebounce from 'hooks/useDebounce'
import { useNetworkState } from 'state/globalNetwork/hooks'
import ImportRow from './ImportRow'
import TokenList from './TokenList'
import { useAllTokens, useToken, useIsUserAddedToken, useFoundOnInactiveList } from '../../hooks/Tokens'
import { isAddress } from '../../utils'
import Column, { AutoColumn } from '../Layout/Column'
import Row from '../Layout/Row'
import CommonBases from './CommonBases'
import CurrencyList from './CurrencyList'
import { filterTokens, useSortedTokensByQuery } from './filtering'
import useTokenComparator from './sorting'


interface StableSearchProps {
  account: string
  selectedCurrency?: Token | null
  onCurrencySelect: (currency: Token) => void
  otherSelectedCurrency?: Token | null
  showCommonBases?: boolean
  showImportView: () => void
  setImportToken: (token: Token) => void
}

const swapSound = new Audio('swap.mp3')

function StableSearch({
  account,
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  showImportView,
  setImportToken,
}: StableSearchProps) {
  const { t } = useTranslation()
  const { chainId } = useNetworkState()

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const [invertSearchOrder] = useState<boolean>(false)

  const allTokens = Object.assign({},
    ...STABLECOINS[chainId].map((_, index) => ({ [STABLECOINS[chainId][index].address]: STABLECOINS[chainId][index] })));

  // if they input an address, use it
  const searchToken = useToken(chainId, debouncedQuery)
  const searchTokenIsAdded = useIsUserAddedToken(searchToken)

  const [audioPlay] = useAudioModeManager()

  const tokenComparator = useTokenComparator(chainId, invertSearchOrder)

  const filteredTokens: Token[] = useMemo(() => {
    return filterTokens(Object.values(allTokens), debouncedQuery)
  }, [allTokens, debouncedQuery])

  const sortedTokens: Token[] = useMemo(() => {
    return filteredTokens.sort(tokenComparator)
  }, [filteredTokens, tokenComparator])

  const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery)

  const handleCurrencySelect = useCallback(
    (currency: Token) => {
      onCurrencySelect(currency)
      if (audioPlay) {
        swapSound.play()
      }
    },
    [audioPlay, onCurrencySelect],
  )

  // if no results on main list, show option to expand into inactive
  const inactiveTokens = useFoundOnInactiveList(chainId, debouncedQuery)
  const filteredInactiveTokens: Token[] = useSortedTokensByQuery(inactiveTokens, debouncedQuery)

  return (
    <>
      <div>
        {searchToken && !searchTokenIsAdded ? (
          <Column style={{ padding: '20px 0', height: '100%' }}>
            <ImportRow token={searchToken} showImportView={showImportView} setImportToken={setImportToken} />
          </Column>
        ) : filteredSortedTokens?.length > 0 || filteredInactiveTokens?.length > 0 ? (
          <Box margin="24px -24px">
            <TokenList
              account={account}
              currencies={
                filteredInactiveTokens ? filteredSortedTokens.concat(filteredInactiveTokens) : filteredSortedTokens
              }
              breakIndex={inactiveTokens && filteredSortedTokens ? filteredSortedTokens.length : undefined}
              onCurrencySelect={handleCurrencySelect}
              otherCurrency={otherSelectedCurrency}
              selectedCurrency={selectedCurrency}
              fixedListRef={fixedList}
            />
          </Box>
        ) : (
          <Column style={{ padding: '20px', height: '100%' }}>
            <Text color="textSubtle" textAlign="center" mb="20px">
              {t('No results found.')}
            </Text>
          </Column>
        )}
      </div>
    </>
  )
}

export default StableSearch
