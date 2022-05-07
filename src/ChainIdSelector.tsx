/* eslint default-case: 0 */
import styled from "styled-components";
import React, { HTMLProps, useCallback, useRef } from 'react'
import {
  CHAIN_INFO,
  L2_CHAIN_IDS,
  SupportedL2ChainId,
} from 'config/constants/index'
import { ChainId } from '@requiemswap/sdk'
import { ArrowDownCircle, ChevronDown } from 'react-feather'
import { switchToNetwork } from 'utils/switchToNetwork'
import { UserMenu as UIKitUserMenu, useMatchBreakpoints, Button, UserMenuItem, Flex, UserMenuDivider, Text, ChevronDownIcon, CogIcon, TuneIcon, TestnetIcon } from '@requiemswap/uikit'
import useActiveWeb3React from "hooks/useActiveWeb3React";
import { useGlobalNetworkActionHandlers, useNetworkState } from "state/globalNetwork/hooks";
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { useChainIdHandling } from 'hooks/useChainIdHandle'
import { useOnClickOutside } from "hooks/useOnClickOutside";
import { useDispatch } from "react-redux";
import { setChainId } from "state/globalNetwork/actions";
import { AppDispatch } from "state";
import { useWeb3React } from "@web3-react/core";


export const Wrapper = styled.div`
  position: relative;
`;

const FlyoutRow = styled.div<{ active: boolean }>`
  align-items: center;
  background-color: ${({ active, theme }) => (active ? theme.colors.contrast : 'transparent')};
  border-radius: 8px;
  color:  ${({ active }) => (active ? 'black' : 'white')};
  cursor: pointer;
  display: flex;
  font-weight: 500;
  justify-content: space-between;
  padding: 6px 8px;
  text-align: left;
  width: 100%;
`;

const SelectorWrapper = styled.div`
  @media screen and (min-width: 720px) {
    position: relative;
  }
`


export const ActivatorButton = styled.button<{ isMobile: boolean, isConnected: boolean }>`
  height: 42px;
  background-color: ${({ theme }) => theme.colors.tertiary};
  border: none;
  border-radius: 20px;
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
  width: ${({ isMobile, isConnected }) => isMobile ? (!isConnected ? '200px' : '120px') : '355px'};

  &:hover {
    font-weight: 500;
    background: #1a1d2f;
    color: ${({ theme }) => theme.colors.primaryBright};
  }
  :focus {
    background-color: ${({ theme }) => theme.colors.dropdown};
    outline: none;
  }
`

const Logo = styled.img`
  height: 25px;
  width: 25px;
`;

const NetworkLabel = styled.div`
  flex: 1 1 auto;
  color: #c7c7c7;
  margin-left: 5px;
  :hover {
    text-decoration: underline;
  }
`;

const FlyoutRowActiveIndicator = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: 50%;
  height: 9px;
  width: 9px;
`;

const StyledLink = styled.a`
  text-decoration: none;
  cursor: pointer;
  color: #c7c7c7;
  font-weight: 500;
  
  :hover {
    text-decoration: underline;
  }

  :focus {
    outline: none;
    text-decoration: underline;
  }

  :active {
    text-decoration: none;
  }
`;
const ActiveRowWrapper = styled.div`
  background-color: ${({ theme }) => theme.colors.tertiary};
  border-radius: 8px;
  padding: 8px 0 8px 0;
  width: 100%;
`;

const ActiveRowLinkList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  & > a {
    align-items: center;
    color: ${({ theme }) => theme.colors.textSubtle};
    display: flex;
    flex-direction: row;
    font-size: 14px;
    font-weight: 500;
    justify-content: space-between;
    padding: 8px 0 4px;
    text-decoration: none;
  }
  & > a:first-child {
    border-top: 1px solid ${({ theme }) => theme.colors.dropdownDeep};
    margin: 0;
    margin-top: 1px;
    padding-top: 2px;
    align: right;
  }
`;

const FlyoutMenu = styled.div<{ isMobile: boolean }>`
  align-items: left;
  margin-top: 52px;
  left: ${({ isMobile }) => isMobile ? '100px' : ''};
  border-radius: 20px;
  position: fixed;
  padding-top: 32px;
  width: 100%;
  height: 420px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
  background-size: 216px;
  background-repeat: no-repeat;
  background-position: left bottom;
  @media (max-width: ${({ theme }) => theme.breakpoints}) {
    display: none;
  }
  border: 1px solid white;

`


const LinkOutCircle = styled(ArrowDownCircle)`
  transform: rotate(230deg);
  width: 16px;
  height: 16px;
`;

const ImageContainer = styled.div`
  width: 40px;
  height: 40px;
  margin-left: -13px;
`


const FlyoutHeader = styled.div`
  color: white;
  font-weight: 400;
  align-items: center;
  text-align: center;
  vertical-align: middle;
`

interface IDropdownItem {
  id: number;
  url: string;
  text: string;
}

interface IProps {
  activatorText?: string;
  items?: IDropdownItem[];
}

const BridgeText = ({ chainId }: { chainId: SupportedL2ChainId }) => {
  switch (chainId) {
    case ChainId.ARBITRUM_MAINNET:
    case ChainId.ARBITRUM_TETSNET_RINKEBY:
      return <div>Arbitrum Bridge</div>
    case ChainId.MATIC_MAINNET:
    case ChainId.MATIC_TESTNET:
      return <div>Polygon Bridge</div>
    default:
      return <div>Bridge</div>
  }
}
const ExplorerText = ({ chainId }: { chainId: SupportedL2ChainId }) => {
  switch (chainId) {
    case ChainId.ARBITRUM_MAINNET:
    case ChainId.ARBITRUM_TETSNET_RINKEBY:
      return <div>Arbiscan</div>
    case ChainId.MATIC_MAINNET:
    case ChainId.MATIC_TESTNET:
      return <div>Polygonscan</div>
    default:
      return <div>Explorer</div>
  }
}

const ChainIdSelector = () => {
  // global network chainId
  const { onChainChange, onAccountChange } = useGlobalNetworkActionHandlers()

  const { chainId: chainIdWeb3, library, account } = useActiveWeb3React()
  useChainIdHandling(chainIdWeb3, account)
  const { chainId } = useNetworkState()
  const dispatch = useDispatch<AppDispatch>()
  const open = useModalOpen(ApplicationModal.NETWORK_SELECTOR)
  const toggle = useToggleModal(ApplicationModal.NETWORK_SELECTOR)

  const node = useRef<HTMLDivElement>()

  // const { isMobile } = useMatchBreakpoints()

  const info = chainId ? CHAIN_INFO[chainId] : undefined
  const activatorText = "Select Chain"
  const isOnL2 = chainId ? L2_CHAIN_IDS.includes(chainId) : false
  const mainnetInfo = CHAIN_INFO[ChainId.BSC_MAINNET]
  const showSelector = Boolean(isOnL2)
  function Row({ targetChain }: { targetChain: number }) {
    const handleRowClick = () => {
      if (chainIdWeb3) {
        switchToNetwork({ library, chainId: targetChain })
        onChainChange(targetChain)
        onAccountChange(account)
        // useToggleModal()
        toggle()
      }

      if (!chainIdWeb3 && !account) {
        dispatch(setChainId({ chainId: targetChain }))
      }
      //  useToggleModal(ApplicationModal.NETWORK_SELECTOR)
    }
    const faucetLink = CHAIN_INFO[targetChain as SupportedL2ChainId].faucet
    const active = chainId === targetChain
    const hasExtendedInfo = L2_CHAIN_IDS.includes(targetChain)
    const rowText = `${CHAIN_INFO[targetChain].label}`
    const RowContent = () => (
      <FlyoutRow active={active} onClick={handleRowClick}>
        <Logo src={CHAIN_INFO[targetChain].logoUrl} />
        <NetworkLabel>{rowText}</NetworkLabel>
        {chainId === targetChain && <FlyoutRowActiveIndicator />}
      </FlyoutRow>
    )

    if (active && hasExtendedInfo) {
      return (
        <ActiveRowWrapper>
          <RowContent />
          <ActiveRowLinkList>
            <StyledLink href={CHAIN_INFO[targetChain as SupportedL2ChainId].bridge}>
              <BridgeText chainId={chainId} /> <LinkOutCircle />
            </StyledLink>
            <StyledLink href={CHAIN_INFO[targetChain].explorer}>
              <ExplorerText chainId={chainId} /> <LinkOutCircle />
            </StyledLink>

            {/* <StyledLink href={helpCenterLink}>
              <div>Help Center</div> <LinkOutCircle />
            </StyledLink> */}
          </ActiveRowLinkList>
        </ActiveRowWrapper>
      )
    }
    return (
      <>
        <RowContent />
        {faucetLink && (<ActiveRowLinkList>
          <Flex flexDirection="row" mr='3px' alignContent='right'>
            <TestnetIcon color="white" width='10px' />
            <StyledLink href={faucetLink}>
              <Text marginLeft='5px' marginRight='5px'>Testnet Faucet</Text>
            </StyledLink>
            <LinkOutCircle color="white" />
          </Flex>
        </ActiveRowLinkList>)}
      </>)
  }


  const activatorRef = React.useRef<HTMLButtonElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };



  const wrapperRef = useRef<HTMLDivElement>()
  useOnClickOutside(wrapperRef, () => setIsOpen(false))

  const isConnected = Boolean(account)

  const { isMobile, isDesktop } = useMatchBreakpoints()
  // React.useEffect(() => {
  //   if (!isOpen) {
  //     setActiveIndex(-1);
  //   }
  // }, [isOpen]);
  // console.log("chainID chainIDselector", chainId)
  const smallText = isMobile
  const buttonText = chainId === 56 ? smallText ? 'BSC' : 'Binance' :
    chainId === 97 ? smallText ? 'BSC Test' : 'Binance Testnet' :
      chainId === 80001 ? smallText ? 'MATIC Test' : 'Polygon Mumbai' :
        chainId === 43114 ? smallText ? 'AVAX' : 'Avalanche' :
          chainId === 43113 ? smallText ? 'AVAX Test' : 'Avalanche Testnet' :
            chainId === 42261 ? smallText ? 'ROSE Test' : 'Oasis Testnet' :
              chainId === 110001 ? smallText ? 'QKC Test S0' : 'Quarkchain Dev S0' : 'no Network'
  return (
    // <UIKitUserMenu text={buttonText} avatarSrc={CHAIN_INFO[chainId ?? 43113].logoUrl}>
    <SelectorWrapper ref={wrapperRef}>
      <ActivatorButton
        isMobile={isMobile}
        aria-haspopup="true"
        aria-controls="dropdown1"
        onClick={handleClick}
        ref={activatorRef}
        onFocus={() => setActiveIndex(-1)}
        isConnected={false}
      >
        <Flex flexDirection="row" mr='3px'>
          <ImageContainer style={{ marginRight: '5px' }}>
            <img src={CHAIN_INFO[chainId ?? 43113].logoUrl} height='10px' alt='' style={{ marginLeft: '0px', position: 'relative' }} />
          </ImageContainer>
          {((isMobile && isConnected) || isDesktop) &&
            (<Text bold textAlign='center' paddingTop='7px'>
              {buttonText}
            </Text>)
          }
        </Flex>
      </ActivatorButton>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >

          <FlyoutMenu isMobile={isMobile}>
            <Flex alignItems="center" justifyContent="space-between" width="100%">
              <Text bold>
                Select a network
              </Text>
              <TuneIcon />
            </Flex>
            <Row targetChain={ChainId.AVAX_TESTNET} />
            <UserMenuDivider />
            <Row targetChain={ChainId.AVAX_MAINNET} />
            <UserMenuDivider />
            <Row targetChain={ChainId.OASIS_TESTNET} />
            <UserMenuDivider />
            <Row targetChain={ChainId.QUARKCHAIN_DEV_S0} />
            <UserMenuDivider />
            <Row targetChain={ChainId.BSC_TESTNET} />
            <UserMenuDivider />
            <Row targetChain={ChainId.MATIC_TESTNET} />
          </FlyoutMenu>

          {/* // </UIKitUserMenu> */}
        </div>
      )}
    </SelectorWrapper>
  );
};

export default ChainIdSelector
