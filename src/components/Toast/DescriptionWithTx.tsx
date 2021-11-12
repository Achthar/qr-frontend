import React from 'react'
import { Link, Text } from '@requiemswap/uikit'
import { getNetworkExplorerLink } from 'utils'
import { useNetworkState } from 'state/globalNetwork/hooks'
import { useTranslation } from 'contexts/Localization'
import truncateHash from 'utils/truncateHash'

interface DescriptionWithTxProps {
  description?: string
  txHash?: string
}

const DescriptionWithTx: React.FC<DescriptionWithTxProps> = ({ txHash, children }) => {
  const { chainId } = useNetworkState()
  const { t } = useTranslation()

  return (
    <>
      {typeof children === 'string' ? <Text as="p">{children}</Text> : children}
      {txHash && (
        <Link external href={getNetworkExplorerLink(txHash, 'transaction', chainId)}>
          {t('View on network explorer')}: {truncateHash(txHash, 8, 0)}
        </Link>
      )}
    </>
  )
}

export default DescriptionWithTx
