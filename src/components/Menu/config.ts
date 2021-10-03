import { MenuEntry } from '@pancakeswap/uikit'
import { ContextApi } from 'contexts/Localization/types'

const config: (t: ContextApi['t']) => MenuEntry[] = (t) => [
  {
    label: t('Home'),
    icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/requiem/REQT_no_background.svg',
    href: '/',
  },
  {
    label: t('Exchange'),
    icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/icons/menu/exchange.svg',
    href: '/exchange',
  },
  {
    label: t('Liquidity'),
    icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/icons/menu/liquidity.svg',
    href: '/liquidity',
  },
  {
    label: t('Farms'),
    icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/icons/menu/farms.svg',
    href: '/farms',
  },
  {
    label: t('Pools'),
    icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/icons/menu/staking.svg',
    href: '/pools',
  },
]

export default config
