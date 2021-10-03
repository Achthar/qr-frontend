import { ContextApi } from 'contexts/Localization/types'
import { PageMeta } from './types'

export const DEFAULT_META: PageMeta = {
  title: 'Requiem Finance',
  description:
    'A DeFi platform that combines lening, a DEX, liquidity farming and collateraliztion.',
  image: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/requiem/REQT_large.png',
}

export const getCustomMeta = (path: string, t: ContextApi['t']): PageMeta => {
  switch (path) {
    case '/':
      return {
        title: `${t('Home')} | ${t('Requiem Finance')}`,
      }
    case '/competition':
      return {
        title: `${t('Trading Battle')} | ${t('Requiem Finance')}`,
      }
    case '/prediction':
      return {
        title: `${t('Prediction')} | ${t('Requiem Finance')}`,
      }
    case '/farms':
      return {
        title: `${t('Farms')} | ${t('Requiem Finance')}`,
      }
    case '/pools':
      return {
        title: `${t('Pools')} | ${t('Requiem Finance')}`,
      }
    case '/lottery':
      return {
        title: `${t('Lottery')} | ${t('Requiem Finance')}`,
      }
    case '/collectibles':
      return {
        title: `${t('Collectibles')} | ${t('Requiem Finance')}`,
      }
    case '/ifo':
      return {
        title: `${t('Initial Farm Offering')} | ${t('Requiem Finance')}`,
      }
    case '/teams':
      return {
        title: `${t('Leaderboard')} | ${t('Requiem Finance')}`,
      }
    case '/profile/tasks':
      return {
        title: `${t('Task Center')} | ${t('Requiem Finance')}`,
      }
    case '/profile':
      return {
        title: `${t('Your Profile')} | ${t('Requiem Finance')}`,
      }
    default:
      return null
  }
}
