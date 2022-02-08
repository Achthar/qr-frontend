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
import { UserMenu as UIKitUserMenu, useMatchBreakpoints, Button, UserMenuItem, Flex, UserMenuDivider, Text, ChevronDownIcon, CogIcon, TuneIcon } from '@requiemswap/uikit'
import useActiveWeb3React from "hooks/useActiveWeb3React";
import { useGlobalNetworkActionHandlers } from "state/globalNetwork/hooks";
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { useOnClickOutside } from "hooks/useOnClickOutside";


export const Wrapper = styled.div`
  position: relative;
`;

const SelectorWrapper = styled.div`
  @media screen and (min-width: 720px) {
    position: relative;
  }
`


export const ActivatorButton = styled.button`
  height: 32px;
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

  :hover {
    background-color: ${({ theme }) => theme.colors.dropdown};
  }
  :focus {
    background-color: ${({ theme }) => theme.colors.dropdown};
    outline: none;
  }
`

const Logo = styled.img`
  height: 20px;
  width: 20px;
  margin-right: 8px;
`;

const NetworkLabel = styled.div`
  flex: 1 1 auto;
  color: #c7c7c7;
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
    border-top: 1px solid ${({ theme }) => theme.colors.textSubtle};
    margin: 0;
    margin-top: 6px;
    padding-top: 10px;
  }
`;

const FlyoutMenu = styled.div`
  align-items: flex-start;
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  border: 1px solid white;
  overflow: auto;
  padding: 16px;
  position: absolute;
  top: 1px;
  width: 250px;
  z-index: 99;
  & > *:not(:last-child) {
    margin-bottom: 12px;
  }
  @media screen and (min-width: 720px) {
    top: 50px;
  }
`


const LinkOutCircle = styled(ArrowDownCircle)`
  transform: rotate(230deg);
  width: 16px;
  height: 16px;
`;

const ImageContainer = styled.div`
  width: 40px;
  text-align: center;
  align-items: left;
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

  const { chainId, library, account } = useActiveWeb3React()

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
      switchToNetwork({ library, chainId: targetChain })
      onChainChange(targetChain)
      onAccountChange(account)
      // useToggleModal()
      toggle()
      //  useToggleModal(ApplicationModal.NETWORK_SELECTOR)
    }
    const faucetLink = CHAIN_INFO[targetChain as SupportedL2ChainId].faucet
    const active = chainId === targetChain
    const hasExtendedInfo = L2_CHAIN_IDS.includes(targetChain)
    const rowText = `${CHAIN_INFO[targetChain].label}`
    const RowContent = () => (
      <UserMenuItem as="button" onClick={handleRowClick}>
        <Logo src={CHAIN_INFO[targetChain].logoUrl} />
        <NetworkLabel>{rowText}</NetworkLabel>
        {chainId === targetChain && <FlyoutRowActiveIndicator />}
      </UserMenuItem>

      /*  <FlyoutRow onClick={handleRowClick} active={active}>
         <Logo src={CHAIN_INFO[targetChain].logoUrl} />
         <NetworkLabel>{rowText}</NetworkLabel>
         {chainId === targetChain && <FlyoutRowActiveIndicator />}
       </FlyoutRow> */
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
          <StyledLink href={faucetLink}>
            <div>Testnet Faucet</div> <LinkOutCircle />
          </StyledLink>
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


  const { isMobile, isDesktop } = useMatchBreakpoints()

  // React.useEffect(() => {
  //   if (!isOpen) {
  //     setActiveIndex(-1);
  //   }
  // }, [isOpen]);
  // console.log("chainID chainIDselector", chainId)
  const buttonText = chainId === 56 ? 'Binance' :
    chainId === 97 ? 'Binance Testnet' :
      chainId === 80001 ? 'Polygon Mumbai' :
        chainId === 43114 ? 'Avalanche' :
          chainId === 43113 ? 'Avalanche Testnet' :
            chainId === 42261 ? 'Oasis Testnet' :
              chainId === 110001 ? 'Quarkchain Dev S0' : 'no Network'
  return (
    // <UIKitUserMenu text={buttonText} avatarSrc={CHAIN_INFO[chainId ?? 43113].logoUrl}>
    <SelectorWrapper ref={node as any}>
      <ActivatorButton
        aria-haspopup="true"
        aria-controls="dropdown1"
        onClick={handleClick}
        ref={activatorRef}
        onFocus={() => setActiveIndex(-1)}
      >
        <Flex flexDirection="row">
          <ImageContainer>
            <img src={CHAIN_INFO[chainId ?? 43113].logoUrl} height='10px' alt='' />
          </ImageContainer>
          {!isMobile ? (
            <Text bold textAlign='center' paddingTop='10px'>
              {buttonText}
            </Text>) : <ChevronDownIcon />}

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
          ref={wrapperRef}
        >

          <FlyoutMenu>
            <Flex alignItems="center" justifyContent="space-between" width="100%">
              <Text bold>
                Select a network
              </Text>
              <TuneIcon />
            </Flex>
            <Row targetChain={ChainId.AVAX_TESTNET} />
            <Row targetChain={ChainId.AVAX_MAINNET} />
            <Row targetChain={ChainId.OASIS_TESTNET} />
            <Row targetChain={ChainId.QUARKCHAIN_DEV_S0} />
            <Row targetChain={ChainId.BSC_TESTNET} />
            <Row targetChain={ChainId.MATIC_TESTNET} />
          </FlyoutMenu>

          {/* // </UIKitUserMenu> */}
        </div>
      )}
    </SelectorWrapper>
  );
};

export default ChainIdSelector
