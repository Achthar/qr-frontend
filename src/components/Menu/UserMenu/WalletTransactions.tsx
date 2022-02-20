import React from 'react'
import { useDispatch } from 'react-redux'
import { Box, Button, Flex, Text } from '@requiemswap/uikit'
import { AppDispatch } from 'state'
import { useAllTransactions } from 'state/transactions/hooks'
import { useTranslation } from 'contexts/Localization'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { clearAllTransactions } from 'state/transactions/actions'
import { orderBy } from 'lodash'
import TransactionRow from './TransactionRow'


interface TransactionProps {
  chainId: number
}
const WalletTransactions: React.FC<TransactionProps> = ({ chainId }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useTranslation()
  const allTransactions = useAllTransactions(chainId)
  const sortedTransactions = orderBy(allTransactions, 'addedTime', 'desc')

  const handleClearAll = () => {
    if (chainId) {
      dispatch(clearAllTransactions({ chainId }))
    }
  }

  return (
    <Box minHeight="120px">
      <Flex alignItems="center" justifyContent="space-between" mb="24px">
        <Text color="secondary" fontSize="12px" textTransform="uppercase" fontWeight="bold">
          {t('Recent Transactions')}
        </Text>
        {sortedTransactions.length > 0 && (
          <Button scale="sm" onClick={handleClearAll} variant="text" px="0">
            {t('Clear all')}
          </Button>
        )}
      </Flex>
      {sortedTransactions.length > 0 ? (
        sortedTransactions.map((txn) => <TransactionRow key={txn.hash} txn={txn} />)
      ) : (
        <Text textAlign="center">{t('No recent transactions')}</Text>
      )}
    </Box>
  )
}

export default WalletTransactions
