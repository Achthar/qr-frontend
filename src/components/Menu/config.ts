import { ContextApi } from 'contexts/Localization/types'
import { Cards } from '@requiemswap/uikit'
import getChain from 'utils/getChain'
import logo from '../../assets/logoTransparent.svg'
import exchangeIconLight from '../../assets/exchangeIconLight.svg'
import exchangeIconDark from '../../assets/exchangeIconDark.svg'
import liquidityIconLight from '../../assets/liquidityIconLight.svg'
import liquidityIconDark from '../../assets/liquidityIconDark.svg'
import stake from '../../assets/stake.svg'

import iconBank from '../../assets/sidebar/ic-bank.svg';
import bond from '../../assets/bonds2.svg'

interface MenuEntry {
  label: string
  icon: string
  iconSelected: string
  href: string
}

const config: (t: ContextApi['t']) => MenuEntry[] = (t) => [
  {
    label: t('Home'),
    icon: logo,
    iconSelected: logo,
    href: '/',
  },
  {
    label: t('Exchange'),
    icon: exchangeIconLight,
    iconSelected: exchangeIconDark,
    href: '/exchange',
  },
  {
    label: t('Liquidity'),
    icon: liquidityIconLight,
    iconSelected: liquidityIconDark,
    href: '/liquidity',
  },
  {
    label: t('Farms'),
    icon: stake,
    iconSelected: stake,
    href: '/farms',
  },
  {
    label: t('Bonds'),
    icon: bond,
    iconSelected: bond,
    href: '/bonds',
  },
  // {
  //   label: t('Pools'),
  //   icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/icons/menu/staking.svg',
  //   href: '/pools',
  // },
]


export const configData: (chainId: number) => MenuEntry[] = (chainId) => {
  const chain = getChain(chainId)
  return [
    {
      label: 'Home',
      icon: logo,
      iconSelected: logo,
      href: '/',
    },
    {
      label: 'Exchange',
      icon: exchangeIconLight,
      iconSelected: exchangeIconDark,
      href: `/${chain}/exchange`,
    },
    {
      label: 'Liquidity',
      icon: liquidityIconLight,
      iconSelected: liquidityIconDark,
      href: `/${chain}/liquidity`,
    },
    {
      label: 'Farms',
      icon: stake,
      iconSelected: stake,
      href: `/${chain}/farms`,
    },
    {
      label: 'Bonds',
      icon: bond,
      iconSelected: bond,
      href: `/${chain}/bonds`,
    },
    // {
    //   label: 'Pools'),
    //   icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/icons/menu/staking.svg',
    //   href: '/pools',
    // },
  ]
}

export const getIcon: (label: string) => any = (label) => {
  if (label === 'Home')
    return logo
  if (label === 'Exchange')
    return exchangeIconLight
  if (label === 'Liquidity')
    return liquidityIconLight
  if (label === 'Farms')
    return stake
  if (label === 'Bonds')
    return bond

  return null
}


export default config
