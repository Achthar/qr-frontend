import { ButtonMenu, ButtonMenuItem, useMatchBreakpoints } from '@pancakeswap/uikit'
import config from 'components/Menu/config'
import { useTranslation } from 'contexts/Localization'
import React from 'react'
import { useHistory, useLocation } from 'react-router'

const LIQUIDITY_ROUTES = ['/add', '/find']
const CustomNav: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const location = useLocation()
  const { isMobile } = useMatchBreakpoints()

  const menuItems = config(t)

  const activeIndex = menuItems.findIndex((i) => {
    const pathname = location.pathname.match(new RegExp(`^${LIQUIDITY_ROUTES.join('|^')}`))
      ? '/liquidity'
      : location.pathname
    return i.href.match(new RegExp(`^${pathname}`))
  })
  const handleMenuItemClick = (index: number) => {
    history.push(menuItems[index].href)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '15px',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        zIndex: 9,
      }}
    >
      <ButtonMenu activeIndex={activeIndex} onItemClick={handleMenuItemClick} scale="md" variant="subtle">
        {menuItems.map((menuItem) =>
          isMobile ? (
            <ButtonMenuItem key={menuItem.label}>{menuItem.label.charAt(0)}</ButtonMenuItem>
          ) : (
            <ButtonMenuItem key={menuItem.label}>{menuItem.label}</ButtonMenuItem>
          ),
        )}
      </ButtonMenu>
    </div>
  )
}

export default CustomNav
