import { UserMenu as UIKitUserMenu, ButtonMenu, ButtonMenuItem, useMatchBreakpoints, UserMenuItem, Flex, ChevronRightIcon, MenuEntry, Text, ChevronDownIcon, UserMenuDivider, SwapIcon } from '@requiemswap/uikit'
import config, { configData, getIcon } from 'components/Menu/config'
import Sidebar from 'components/Sidebar'
import { ChevronsLeft } from 'react-feather'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useHistory, useLocation } from 'react-router'
import { useNetworkState } from 'state/globalNetwork/hooks'
import styled from 'styled-components'
import getChain from 'utils/getChain'
import React, { useCallback, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useChainIdHandling } from 'hooks/useChainIdHandle'
import logo from './assets/logoTransparent.svg'
import bgSidebar from './assets/sidebar/bg-sidebar.png';
import iconHome from './assets/sidebar/ic-home.svg';
import iconBank from './assets/swap.svg';
import iconGovernment from './assets/sidebar/ic-government.svg';
import iconPools from './assets/farms.svg';
import iconMedium from './assets/sidebar/ic-medium.svg';
import iconDiscord from './assets/sidebar/ic-discord.svg';
import iconTelegram from './assets/sidebar/ic-telegram.svg';
import iconGithub from './assets/sidebar/ic-github.svg';
import iconTwitter from './assets/sidebar/ic-twitter.svg';
import iconDoc from './assets/sidebar/ic-doc.svg';
import iconLiquidity from './assets/liquidity.svg';
import iconAudit from './assets/sidebar/audit.svg';

import bond from './assets/bonds2.svg'
import iconREQTransparent from './assets/REQ_Transparent.png';


export const ExternalLinks = {
  twitter: 'https://twitter.com/requiem_finance',
  documentations: 'https://docs.requiem.finance',
  codes: 'https://github.com/Requiem-Finance',
  discord: 'https://discord.gg/HuekxzYj3p',
  medium: 'https://medium.com/@requiem-finance',
  telegram: 'https://t.me/+Lbc1zHODTQw3YWM6',
  buyShareHref:
    'https://requiem.finance/avax-test/exchange',
};

interface LogoProps {
  shorten?: boolean;
}

const Logo: React.FC<LogoProps> = ({ shorten }) => {
  return (
    <StyledLogo to="/">
      {
        shorten ?
          <img src='https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/tokens/REQT.png' height="48" alt='' /> :
          <img src='https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/tokens/REQT.png' height="48" alt='' />
      }
    </StyledLogo>
  );
};

const StyledLogo = styled(NavLink)`
  align-items: center;
  display: flex;
  @media (max-width: 768px) {
    img {
      height: 46px;
    }
  }
`;

const ImageGov = styled.img<{ open: boolean }>`
    width: 20px;
    height: 20px;
    margin-right: 15px;
    ${({ open }) => open ? 'margin-left: -20px;' : ''}
    `;


interface NavContainerProps {
  isMobile: boolean
  chainId?: number
  onClickItem?: () => void;
}

const NavContainer: React.FC<NavContainerProps> = ({ isMobile, chainId, onClickItem }) => {
  const handleClick = useCallback(() => {
    if (!onClickItem) return;
    onClickItem();
  }, [onClickItem]);
  const [open, setOpen] = useState(false)
  const chain = getChain(chainId)

  return (
    <StyledNavContainer>
      <StyledNavItem onClick={handleClick}>
        <StyledNavLink to="/" activeClassName="active" exact>
          <img src={iconREQTransparent} alt='' />
          Home
        </StyledNavLink>
      </StyledNavItem>
      <StyledNavItem onClick={handleClick}>
        <StyledNavLink to={`/${chain}/exchange`} activeClassName="active">
          <img src={iconBank} alt='' />
          Exchange
        </StyledNavLink>
      </StyledNavItem>
      <StyledNavItem onClick={handleClick}>
        <StyledNavLink to={`/${chain}/liquidity`} activeClassName="active">
          <img src={iconLiquidity} alt='' />
          Liquidity
        </StyledNavLink>
      </StyledNavItem>
      <StyledNavItem onClick={handleClick}>
        <StyledNavLink to={`/${chain}/farms`}>
          <img src={iconPools} alt='' />
          Farms
        </StyledNavLink>
      </StyledNavItem>
      <StyledNavItem onClick={handleClick}>
        <StyledNavLink to={`/${chain}/bonds`}>
          <img src={bond} alt='' />
          Bonds
        </StyledNavLink>
      </StyledNavItem>
      <StyledNavItemDynamic open={open}>
        {/* <StyledNavLink to={`/${chain}/governance`}> */}

        <StyledNavText onClick={() => { setOpen(!open) }}>
          <div onClick={() => { setOpen(!open) }} role="button" onKeyPress={() => { return null }}
            tabIndex={0}>
            <ImageGov src={iconGovernment} alt='' open={open} />
          </div>
          Governance
        </StyledNavText>
        <Collapsible open={open} isMobile={isMobile}>
          <StyledNavLink to={`/${chain}/governance`}>
            Requiem Reward
          </StyledNavLink>
          <StyledNavLink to={`/${chain}/governance-ab`}>
            Asset-Backed Requiem
          </StyledNavLink>
        </Collapsible>
        {/* </StyledNavLink> */}
      </StyledNavItemDynamic>

      <StyledNavItem onClick={handleClick}>
        <StyledLinkHref
          href={ExternalLinks.documentations}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={iconDoc} alt='' />
          Documentation
          <i className="fas fa-external-link" />
        </StyledLinkHref>
      </StyledNavItem>
    </StyledNavContainer>
  );
};

interface MenuBarProps {
  isMobile: boolean
  chainId?: number
  onClick?: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({ isMobile, chainId, onClick }) => {
  return (
    <div style={{
      marginBottom: '64px',
    }}>
      <StyledSidebar>
        {/* <StyledLogoContainer>
          <Logo />
        </StyledLogoContainer> */}
        <NavContainer chainId={chainId} onClickItem={onClick} isMobile={isMobile} />
        {/* <StyledAudit
          href="https://docs.iron.finance/audits"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={iconAudit} alt='' />
        </StyledAudit> */}

        <UserMenuDivider />
        <Flex flexDirection="row" alignItems='left'>
          <StyledExternalLink>
            <StyledLink target="_blank" rel="noopener noreferrer" href={ExternalLinks.medium}>
              <StyledIcon>
                <img src={iconMedium} alt='' />
              </StyledIcon>
            </StyledLink>
            <StyledLink target="_blank" rel="noopener noreferrer" href={ExternalLinks.twitter}>
              <StyledIcon>
                <img src={iconTwitter} alt='' />
              </StyledIcon>
            </StyledLink>
            <StyledLink target="_blank" rel="noopener noreferrer" href={ExternalLinks.discord}>
              <StyledIcon>
                <img src={iconDiscord} alt='' />
              </StyledIcon>
            </StyledLink>
            <StyledLink target="_blank" rel="noopener noreferrer" href={ExternalLinks.telegram}>
              <StyledIcon>
                <img src={iconTelegram} alt='' />
              </StyledIcon>
            </StyledLink>
            <StyledLink target="_blank" rel="noopener noreferrer" href={ExternalLinks.codes}>
              <StyledIcon>
                <img src={iconGithub} alt='' />
              </StyledIcon>
            </StyledLink>
          </StyledExternalLink>
        </Flex>
      </StyledSidebar>
    </div>
  );
};

export const getMenuIcon: (label: string) => any = (label) => {
  if (label === 'Home')
    return iconREQTransparent
  if (label === 'Exchange')
    return iconBank
  if (label === 'Liquidity')
    return iconLiquidity
  if (label === 'Farms')
    return bond
  if (label === 'Bonds')
    return bond

  return null
}


const StyledAudit = styled.a`
  align-self: center;
  img {
    width: 93px;
    margin-bottom: 23px;
  }
`;

const Collapsible = styled.div<{ open: boolean, isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  justify-content: center;
  text-align: left;
  width: 100%;
  height:  ${({ open }) => !open ? '0%' : '100%'};
  transform: ${({ open, isMobile }) => (isMobile ? !open ? 'translateX(0%) scaleY(0.0)' : 'translateX(-99%)  scaleY(1.0)' :
    !open ? 'translateX(0%) scaleY(0.0)' : 'translateX(-99%)  scaleY(1.0)')};
  transition: transform 300ms ease-in-out;
  position:relative;
`

const StyledExternalLink = styled.div`
  display: grid;
  grid-template-columns: auto auto auto auto auto;
  justify-items: center;
  margin-bottom: 30px;
  padding: 0px 20px;
`;

const StyledIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  border-radius: 100%;
  border: solid 1px #2b2a35;
  img {
    width: 15px;
  }
  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
    background-color: ${(props) => props.theme.colors.primary};
    img {
      filter: brightness(0) invert(1);
    }
  }
`;

const StyledLink = styled.a`
  color: ${(props) => props.theme.colors.primary};
  text-decoration: none;
  &:hover {
    color: ${(props) => props.theme.colors.primary};
  }
`;

const StyledSidebar = styled.div`
  border-radius: 20px;
  position: fixed;
  padding-top: 32px;
  width: 100%;
  height: 490px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  background-size: 216px;
  @media (max-width: ${({ theme }) => theme.breakpoints}) {
    display: none;
  }
  border: 1px solid white;
`;

const StyledLogoContainer = styled.div`
  display: flex;
  justify-content: center;
  h1 {
    color: ${({ theme }) => theme.colors.primaryDark};
    padding: 0;
    margin: 0;
  }
`;

const StyledNavContainer = styled.ul`
  padding: 0px;
  margin-top: 25px;
  flex: 1;
  overflow-y: auto;
  ::-webkit-scrollbar {
    width: 12px;
  }

  ::-webkit-scrollbar-track {
    background: #111327;
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: #191d3a;
  }
`;

const StyledNavItem = styled.li`
  display: flex;
  align-items: center;
  height:52px;
`;

const StyledNavItemDynamic = styled.div<{ open: boolean }>`
  display: flex;
  align-items: center;
  height: ${({ open }) => open ? '104px' : '52px'};
`;


const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  width: 100%;
  height: 52px;
  padding: 0px 28px;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  color: #8f929a;
  border-left: solid 5px transparent;
  img {
    width: 20px;
    height: 20px;
    margin-right: 15px;
  }
  &.active,
  &.matched {
    font-weight: 500;
    background: #1a1d2f;
    color: ${({ theme }) => theme.colors.primaryBright};
    border-left: solid 5px #54051d;
    img {
      filter: brightness(0) invert(1);
    }
  }
  &:not(.active):hover {
    font-weight: 500;
    background: #1a1d2f;
    color: ${({ theme }) => theme.colors.primaryBright};
    border-left: solid 5px #54051d22;
    img {
      filter: brightness(0) invert(1);
    }
  }
  @media screen and (min-width: 720px) {
    top: 50px;
  }
`;

const StyledNavText = styled(Text)`
  display: flex;
  align-items: center;
  width: 100%;
  height: 52px;
  padding: 0px 28px;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  color: #8f929a;
  border-left: solid 5px transparent;
  img {
    width: 20px;
    height: 20px;
    margin-right: 15px;
  }
  &.active,
  &.matched {
    font-weight: 500;
    background: #1a1d2f;
    color: ${({ theme }) => theme.colors.primaryBright};
    border-left: solid 5px #54051d;
    img {
      filter: brightness(0) invert(1);
    }
  }
  &:not(.active):hover {
    font-weight: 500;
    background: #1a1d2f;
    color: ${({ theme }) => theme.colors.primaryBright};
    border-left: solid 5px #54051d22;
    img {
      filter: brightness(0) invert(1);
    }
  }
  @media screen and (min-width: 720px) {
    top: 50px;
  }
`;

const StyledLinkHref = styled.a`
  display: flex;
  align-items: center;
  width: 100%;
  height: 52px;
  padding: 0px 28px;
  font-weight: 500;
  font-size: 18px;
  color: #8f929a;
  text-decoration: none;
  font-size: 16px;
  border-left: solid 5px transparent;
  i {
    margin-left: 8px;
    font-size: 12px;
  }
  img {
    width: 20px;
    height: 20px;
    margin-right: 15px;
  }
  &.active,
  &.matched {
    background: #1a1d2f;
    color: ${({ theme }) => theme.colors.primaryBright};
    border-left: solid 5px #fea430;
  }
  &:hover {
    font-weight: 500;
    background: #1a1d2f;
    color: ${({ theme }) => theme.colors.primaryBright};
    border-left: solid 5px #fea43022;
    img {
      filter: brightness(0) invert(1);
    }
  }
`;

const StyledAuthorView = styled.a`
  padding-bottom:80px;
  text-decoration: none;
  font-size: 13px;
  color: #8f929a;
  text-align: center;
  &:hover {
    color: #fea430;
  }
`;


export const ActivatorButton = styled.button<{ isMobile: boolean }>`
  zIndex: 8;
  height: 52px;
  background-color: ${({ theme }) => theme.colors.tertiary};
  border-left: solid 5px transparent;
  border: none;
  border-radius: 30px;
  font-size: 0.875rem;
  font-weight: 400;
  margin-left: 0.4rem;
  margin-right: 0.4rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.background};
  display: flex;
  justify-content: space-between;
  align-items: center;
  float: right;
  ${({ isMobile }) => isMobile ? 'width: 400px; margin-right: -40px;' : 'width: 570px; margin-right: -40px;'};

  &:hover {
    font-weight: 500;
    background: #1a1d2f;
    color: ${({ theme }) => theme.colors.primaryBright};
    border-left: solid 10px white;
  }
  :focus {
    background-color: ${({ theme }) => theme.colors.dropdown};
    outline: none;
  }
`
const ImageContainer = styled.div`
  width: 40px;
  height: 100%;
  margin-left: 1px;
`

const LIQUIDITY_ROUTES = ['/add', '/find', '/remove']

interface MenuProps {
  history: any
  current: any
  menuItem: any
  isMobile: boolean
}


const MenuItem: React.FC<MenuProps> = ({ history, current, menuItem, isMobile }) => {
  return (
    <>
      <StyledNavItem onClick={() => {
        history.push(menuItem.href)
      }}>
        <StyledNavLink to="/" activeClassName="active" exact>
          <img src={current?.label === menuItem?.label ? menuItem.iconSelected : menuItem.icon} alt='' />
          {menuItem.label}
        </StyledNavLink>
      </StyledNavItem>
    </>


  )
}



export const configDataEntries: (chainId: number) => MenuEntry[] = (chainId) => {
  const chain = getChain(chainId)
  return [
    {
      label: 'Home',
      icon: iconREQTransparent,
      iconSelected: iconREQTransparent,
      href: '/',
    },
    {
      label: 'Exchange',
      icon: iconBank,
      iconSelected: iconBank,
      href: `/${chain}/exchange`,
    },
    {
      label: 'Liquidity',
      icon: iconLiquidity,
      iconSelected: iconLiquidity,
      href: `/${chain}/liquidity`,
    },
    {
      label: 'Farms',
      icon: iconPools,
      iconSelected: iconPools,
      href: `/${chain}/farms`,
    },
    {
      label: 'Bonds',
      icon: bond,
      iconSelected: bond,
      href: `/${chain}/bonds`,
    },
    {
      label: 'Governing',
      icon: iconGovernment,
      iconSelected: iconGovernment,
      href: `/${chain}/governance`,
    },
    // {
    //   label: 'Pools'),
    //   icon: 'https://requiem-finance.s3.eu-west-2.amazonaws.com/icons/menu/staking.svg',
    //   href: '/pools',
    // },
  ]
}

const GeneralNav: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const { isMobile } = useMatchBreakpoints()

  const { chainId, library, account } = useActiveWeb3React()

  const menuItems = configDataEntries(chainId)

  const activeIndex = menuItems.findIndex((i) => {
    const pathname = location.pathname.match(new RegExp(`^${LIQUIDITY_ROUTES.join('|^')}`))
      ? '/liquidity'
      : location.pathname
    return i.href.match(new RegExp(`^${pathname}`))
  })

  const [isOpen, setIsOpen] = React.useState(false);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const wrapperRef = useRef<HTMLDivElement>()
  useOnClickOutside(wrapperRef, () => setIsOpen(false))

  const [activeIndex1, setActiveIndex] = React.useState(-1);

  const isConnected = Boolean(account)

  const current = menuItems[activeIndex]

  const fbIcon = location.pathname.includes('remove') || location.pathname.includes('add') || location.pathname.includes('find') ? getMenuIcon('Liquidity') : current?.icon
  const fbLabel = location.pathname.includes('remove') || location.pathname.includes('add') || location.pathname.includes('find') ? 'Liquidity' : current?.label
  const activatorRef = React.useRef<HTMLButtonElement | null>(null);
  return (
    <div ref={wrapperRef}>
      <ActivatorButton
        aria-haspopup="true"
        aria-controls="dropdown1"
        onClick={handleClick}
        ref={activatorRef}
        onFocus={() => setActiveIndex(-1)}
        isMobile={isMobile}
      >
        <Flex flexDirection="row">
          <ImageContainer>
            <img src={fbIcon ?? 'https://requiem-finance.s3.eu-west-2.amazonaws.com/logos/requiem/REQT_large.png'} alt='' width='40px' />
          </ImageContainer>
          <Text bold textAlign='center' paddingTop='9px' marginLeft='15px'>
            {fbLabel}
          </Text>

        </Flex>
      </ActivatorButton>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '64px',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <MenuBar chainId={chainId} onClick={handleClick} isMobile={isMobile} />
        </div>
      )}

    </div>
  )
}

export default GeneralNav
