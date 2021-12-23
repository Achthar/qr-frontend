import React from 'react'
import { Flex, UserMenuItem, WarningIcon } from '@requiemswap/uikit'
import { useTranslation } from 'contexts/Localization'

interface WalletUserMenuItemProps {
  hasLowNetworkCcyBalance: boolean
  onPresentWalletModal: () => void
}

const WalletUserMenuItem: React.FC<WalletUserMenuItemProps> = ({ hasLowNetworkCcyBalance, onPresentWalletModal }) => {
  const { t } = useTranslation()

  return (
    <UserMenuItem as="button" onClick={onPresentWalletModal}>
      <Flex alignItems="center" justifyContent="space-between" width="100%">
        {t('Wallet')}
        {hasLowNetworkCcyBalance && <WarningIcon color="warning" width="24px" />}
      </Flex>
    </UserMenuItem>
  )
}

export default WalletUserMenuItem
