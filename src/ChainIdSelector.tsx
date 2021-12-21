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
import { UserMenu as UIKitUserMenu, useMatchBreakpoints, Button, UserMenuItem } from '@requiemswap/uikit'
import { useWeb3React } from "@web3-react/core";
import { useGlobalNetworkActionHandlers } from "state/globalNetwork/hooks";
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleModal } from 'state/application/hooks'

export const Wrapper = styled.div`
  position: relative;
`;

export const ActivatorButton = styled.button`
  height: 33px;
  background-color: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: 12px;
  padding:  6px 8px;
  font-size: 0.875rem;
  font-weight: 400;
  margin-left: 0.4rem;
  margin-right: 0.4rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text};
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
  background-color: ${({ theme }) => theme.colors.backgroundAlt};
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


const LinkOutCircle = styled(ArrowDownCircle)`
  transform: rotate(230deg);
  width: 16px;
  height: 16px;
`;

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

  const { chainId, library, account } = useWeb3React()

  const open = useModalOpen(ApplicationModal.NETWORK_SELECTOR)
  const toggle = useToggleModal(ApplicationModal.NETWORK_SELECTOR)

  const node = useRef<HTMLDivElement>()

  // const { isMobile } = useMatchBreakpoints()

  const info = chainId ? CHAIN_INFO[chainId] : undefined

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

  // const activatorRef = React.useRef<HTMLButtonElement | null>(null);
  // const listRef = React.useRef<HTMLUListElement | null>(null);
  // const [isOpen, setIsOpen] = React.useState(false);
  // const [activeIndex, setActiveIndex] = React.useState(-1);

  // const handleClick = () => {
  //   setIsOpen(!isOpen);
  // };

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
            chainId === 42261 ? 'Oasis Testnet' : 'no Network'
  return (
    <UIKitUserMenu text={buttonText} avatarSrc={CHAIN_INFO[chainId ?? 43113].logoUrl}>


      {/* <Wrapper> */}

      <FlyoutHeader>
        Select a network
      </FlyoutHeader>
      <Row targetChain={ChainId.AVAX_MAINNET} />
      <Row targetChain={ChainId.AVAX_TESTNET} />
      <Row targetChain={ChainId.OASIS_TESTNET} />
      {/* <Row targetChain={ChainId.BSC_MAINNET} /> */}
      <Row targetChain={ChainId.BSC_TESTNET} />
      <Row targetChain={ChainId.MATIC_TESTNET} />
      {/* </Wrapper> */}

    </UIKitUserMenu>
  );
};

export default ChainIdSelector
