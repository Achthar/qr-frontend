import React from 'react'
import { Menu as UikitMenu } from '@requiemswap/uikit'
import { languageList } from 'config/localization/languages'
import { useTranslation } from 'contexts/Localization'
import useTheme from 'hooks/useTheme'
import config from './config'
import UserMenu from './UserMenu'
import GlobalSettings from './GlobalSettings'
// import { useCakeBusdPriceNumber } from '../../hooks/useUSDPrice'


const Menu = (props) => {
  const { isDark, toggleTheme } = useTheme()
  const reqtPriceUsd = null
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
      reqtPriceUsd={reqtPriceUsd}
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
