import React from 'react'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import {
  Flex,
  LogoutIcon,
  useModal,
  UserMenu as UIKitUserMenu,
  UserMenuDivider,
  UserMenuItem,
} from '@requiemswap/uikit'
import useAuth from 'hooks/useAuth'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { FetchStatus, useGetNetworkCcyBalance } from 'hooks/useTokenBalance'
import { useTranslation } from 'contexts/Localization'
import WalletModal, { WalletView, LOW_NETWORK_CCY_BALANCE } from './WalletModal'
import ProfileUserMenuItem from './ProfileUserMenutItem'
import WalletUserMenuItem from './WalletUserMenuItem'

const UserMenu = () => {
  const { t } = useTranslation()
  const { account, chainId } = useActiveWeb3React()
  const { logout } = useAuth()
  const { balance, fetchStatus } = useGetNetworkCcyBalance()
  // const { isInitialized, isLoading, profile } = useProfile()

  const isInitialized = false
  const isLoading = false
  const profile = null

  const [onPresentWalletModal] = useModal(<WalletModal chainId={chainId} initialView={WalletView.WALLET_INFO} />)
  const [onPresentTransactionModal] = useModal(<WalletModal chainId={chainId} initialView={WalletView.TRANSACTIONS} />)
  const hasProfile = isInitialized && !!profile
  const avatarSrc = profile && profile.nft ? `/images/nfts/${profile.nft.images.sm}` : undefined
  const hasLowNetworkCcyBalance = fetchStatus === FetchStatus.SUCCESS && balance.lte(LOW_NETWORK_CCY_BALANCE)

  if (!account) {
    return <ConnectWalletButton scale="sm" />
  }

  return (
    <UIKitUserMenu account={account} avatarSrc={avatarSrc}>
      <WalletUserMenuItem hasLowNetworkCcyBalance={hasLowNetworkCcyBalance} onPresentWalletModal={onPresentWalletModal} />
      <UserMenuItem as="button" onClick={onPresentTransactionModal}>
        {t('Transactions')}
      </UserMenuItem>
      <UserMenuDivider />
      <UserMenuItem as="button" onClick={logout}>
        <Flex alignItems="center" justifyContent="space-between" width="100%">
          {t('Disconnect')}
          <LogoutIcon />
        </Flex>
      </UserMenuItem>
    </UIKitUserMenu>
  )
}

export default UserMenu
