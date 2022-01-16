import { ContextApi } from 'contexts/Localization/types'
import { PageMeta } from './types'

export const DEFAULT_META: PageMeta = {
  title: 'Requiem Finance',
  description:
    'A DeFi platform that combines lening, a DEX, liquidity farming and collateraliztion.',
  image: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/requiem/REQT_transparent.png',
}

export const getCustomMeta = (path: string, t: ContextApi['t']): PageMeta => {
  switch (path) {
    case '/':
      return {
        title: `${t('Home')} | ${t('Requiem Finance')}`,
      }
    case '/prediction':
      return {
        title: `${t('Prediction')} | ${t('Requiem Finance')}`,
      }
    case '/liquidity':
      return {
        title: `${t('Liquidity')} | ${t('Requiem Finance')}`,
      }
    case '/exchange':
      return {
        title: `${t('Exchange')} | ${t('Requiem Finance')}`,
      }
    case '/pools':
      return {
        title: `${t('Pools')} | ${t('Requiem Finance')}`,
      }
    case '/bonds':
      return {
        title: `${t('Bonds')} | ${t('Requiem Finance')}`,
      }
    default:
      return null
  }
}
