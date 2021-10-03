import { MenuEntry } from '@pancakeswap/uikit'
import { ContextApi } from 'contexts/Localization/types'

const config: (t: ContextApi['t']) => MenuEntry[] = (t) => [
  {
    label: t('Home'),
    icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/icons/menu/home.png',
    href: '/',
  },
  {
    label: t('Exchange'),
    icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/icons/menu/trade.png',
    href: '/exchange',
  },
  {
    label: t('Liquidity'),
    icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/icons/menu/liquidity.png',
    href: '/liquidity',
  },
  {
    label: t('Farms'),
    icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/icons/menu/farms.png',
    href: '/farms',
  },
  {
    label: t('Pools'),
    icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/icons/menu/staking.png',
    href: '/pools',
  },
]

export default config
