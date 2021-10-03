import React from 'react'
import { Menu as UikitMenu } from '@pancakeswap/uikit'
import { languageList } from 'config/localization/languages'
import { useTranslation } from 'contexts/Localization'
import useTheme from 'hooks/useTheme'
import { usePriceCakeBusd } from 'state/farms/hooks'
import config from './config'
import UserMenu from './UserMenu'
import GlobalSettings from './GlobalSettings'
import { useCakeBusdPriceNumber } from '../../hooks/useBUSDPrice'


const Menu = (props) => {
  const { isDark, toggleTheme } = useTheme()
  const cakePriceUsd = useCakeBusdPriceNumber(5)
  const  profile  = null
  const { currentLanguage, setLanguage, t } = useTranslation()

  return (
    <UikitMenu
      userMenu={<UserMenu />}
      globalMenu={<GlobalSettings />}
      isDark={isDark}
      toggleTheme={undefined}
      currentLang={currentLanguage.code}
      langs={[]}
      setLang={undefined}
      cakePriceUsd={cakePriceUsd}
      links={config(t)}
      profile={{
        username: profile?.username,
        image: profile?.nft ? `/images/nfts/${profile.nft?.images.sm}` : undefined,
        profileLink: '/profile',
        noProfileLink: '/profile',
        showPip: !profile?.username,
      }}
      {...props}
    />
  )
}

export default Menu
