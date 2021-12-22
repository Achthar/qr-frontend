import React from 'react'
import { HistoryIcon, Button, useModal } from '@requiemswap/uikit'
import TransactionsModal from './TransactionsModal'

const Transactions = (chainId: number, account: string) => {
  const [onPresentTransactionsModal] = useModal(<TransactionsModal chainId={chainId} account={account} />)
  return (
    <>
      <Button variant="text" p={0} onClick={onPresentTransactionsModal} ml="16px">
        <HistoryIcon color="textSubtle" width="24px" />
      </Button>
    </>
  )
}

export default Transactions
