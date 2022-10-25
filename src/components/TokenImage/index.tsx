import React from 'react'
import {
  TokenPairImage as UIKitTokenPairImage,
  TokenPairImageProps as UIKitTokenPairImageProps,
  TokenImage as UIKitTokenImage,
  ImageProps,
} from '@requiemswap/uikit'
import { getAddress } from 'utils/addressHelpers'
import { NETWORK_CCY, WRAPPED_NETWORK_TOKENS, Token } from '@requiemswap/sdk'
import { getTokenLogoURLFromSymbol } from 'utils/getTokenLogoURL'

interface TokenPairImageProps extends Omit<UIKitTokenPairImageProps, 'primarySrc' | 'secondarySrc'> {
  chainId: number,
  primaryToken: Token
  secondaryToken: Token
}

const getImageUrlFromToken = (chainId: number, token: Token) => {
  // const address = getAddress(chainId ?? 56, token.symbol === NETWORK_CCY[chainId ?? 56].symbol ? WRAPPED_NETWORK_TOKENS[chainId].address : token.address)
  return getTokenLogoURLFromSymbol(token.symbol)
}

export const TokenPairImage: React.FC<TokenPairImageProps> = ({ chainId, primaryToken, secondaryToken, ...props }) => {
  return (
    <UIKitTokenPairImage
      primarySrc={getImageUrlFromToken(chainId, primaryToken)}
      secondarySrc={getImageUrlFromToken(chainId, secondaryToken)}
      {...props}
    />
  )
}

interface TokenImageProps extends ImageProps {
  chainId: number,
  token: Token
}

export const TokenImage: React.FC<TokenImageProps> = ({ chainId, token, ...props }) => {
  return <UIKitTokenImage src={getImageUrlFromToken(chainId, token)} {...props} />
}
