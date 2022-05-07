import React, { KeyboardEvent, RefObject, useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { Currency, Token, NETWORK_CCY, STABLES_INDEX_MAP, STABLECOINS } from '@requiemswap/sdk'
import { Text, Input, Box } from '@requiemswap/uikit'
import Dots from 'components/Loader/Dots'
import { useTranslation } from 'contexts/Localization'
import { FixedSizeList } from 'react-window'
import Row from 'components/Row'
import { useAudioModeManager } from 'state/user/hooks'
import useDebounce from 'hooks/useDebounce'
import { useNetworkState } from 'state/globalNetwork/hooks'
import ImportRow from './ImportRow'
import TokenList from './TokenList'
import { filterTokens, useSortedTokensByQuery } from './filtering'
import useTokenComparator from './sorting'
import Column, { AutoColumn } from '../Layout/Column'
import { useAllTokens, useToken, useIsUserAddedToken, useFoundOnInactiveList } from '../../hooks/Tokens'




interface TokenSearchProps {
  account: string
  tokens: Token[]
  selectedCurrency?: Token | null
  onCurrencySelect: (currency: Token) => void
  otherSelectedCurrency?: Token | null
  showImportView: () => void
  setImportToken: (token: Token) => void
}

function TokenSearch({
  account,
  tokens,
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
}: TokenSearchProps) {

  const handleCurrencySelect = useCallback(
    (currency: Token) => {
      onCurrencySelect(currency)
    },
    [onCurrencySelect],
  )

  return (

    <div
      style={{
        // position: 'fixed',
        // bottom: '15px',
        width: '100%',
        maxWidth: '420px',
        // alignItems: 'center',
        borderRadius: '16px',
        zIndex: 99,
      }}
    >
      {tokens?.length > 0 ? (
        <Box height='100%'>
          <TokenList
            account={account}
            currencies={tokens}
            breakIndex={tokens?.length}
            onCurrencySelect={handleCurrencySelect}
            otherCurrency={otherSelectedCurrency}
            selectedCurrency={selectedCurrency}
          />
        </Box>
      ) : (
        <Column style={{ padding: '20px', height: '100%' }}>
          <Text color="textSubtle" textAlign="center" mb="20px">
            <Dots>Loading</Dots>
          </Text>
        </Column>
      )}
    </div>

  )
}

export default TokenSearch
