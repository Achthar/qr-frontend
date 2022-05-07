import React from 'react'
import { Box, Button, Flex, InjectedModalProps, LinkExternal, Message, Text } from '@requiemswap/uikit'
import { NETWORK_CCY } from '@requiemswap/sdk'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useTokenBalance, { useGetNetworkCcyBalance } from 'hooks/useTokenBalance'
import { getRequiemAddress } from 'utils/addressHelpers'
import useAuth from 'hooks/useAuth'
import { useTranslation } from 'contexts/Localization'
import { getNetworkExplorerLink } from 'utils'
import { getFullDisplayBalance } from 'utils/formatBalance'
// import { useReqtPrice } from 'hooks/usePrice'
import CopyAddress from './CopyAddress'

interface WalletInfoProps {
  hasLowNetworkCcyBalance: boolean
  onDismiss: InjectedModalProps['onDismiss']
}

const WalletInfo: React.FC<WalletInfoProps> = ({ hasLowNetworkCcyBalance, onDismiss }) => {
  const { t } = useTranslation()
  const { account, chainId } = useActiveWeb3React()
  const { balance } = useGetNetworkCcyBalance()
  // const reqtPrice = useReqtPrice(chainId)
  const { balance: requiemBalance } = useTokenBalance(getRequiemAddress(chainId))
  const { logout } = useAuth()

  const handleLogout = () => {
    onDismiss()
    logout()
  }

  return (
    <>
      <Text color="secondary" fontSize="12px" textTransform="uppercase" fontWeight="bold" mb="8px">
        {t('Your Address')}
      </Text>
      <CopyAddress account={account} mb="24px" />
      {hasLowNetworkCcyBalance && (
        <Message variant="warning" mb="24px">
          <Box>
            <Text fontWeight="bold">{`${NETWORK_CCY[chainId].symbol} Balance Low`}</Text>
            <Text as="p">{`You need ${NETWORK_CCY[chainId].symbol} for transaction fees`}</Text>
          </Box>
        </Message>
      )}
      <Flex alignItems="center" justifyContent="space-between">
        <Text color="textSubtle">{`${NETWORK_CCY[chainId].symbol} Balance`}</Text>
        <Text>{getFullDisplayBalance(balance, 18, 6)}</Text>
      </Flex>
      <Flex alignItems="center" justifyContent="space-between" mb="24px">
        <Text color="textSubtle">{t('REQT Balance')}</Text>
        <Text>{getFullDisplayBalance(requiemBalance, 18, 3)}</Text>
      </Flex>
      <Flex alignItems="center" justifyContent="space-between" mb="24px">
        <Text color="textSubtle">{t('REQT Price')}</Text>
        {/* <Text>{reqtPrice}</Text> */}
      </Flex>
      <Flex alignItems="center" justifyContent="end" mb="24px">
        <LinkExternal href={getNetworkExplorerLink(account, 'address', chainId)}>View on Network Explorer</LinkExternal>
      </Flex>
      <Button variant="secondary" width="100%" onClick={handleLogout}>
        {t('Disconnect Wallet')}
      </Button>
    </>
  )
}

export default WalletInfo
