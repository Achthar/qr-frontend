import React from 'react'
import {
  TokenPairImage as UIKitTokenPairImage,
  TokenPairImageProps as UIKitTokenPairImageProps,
  TokenImage as UIKitTokenImage,
  ImageProps,
} from '@pancakeswap/uikit'
import tokens from 'config/constants/tokens'
import { Token } from 'config/constants/types'
import { getAddress } from 'utils/addressHelpers'
import { NETWORK_CCY } from '@pancakeswap/sdk'

interface TokenPairImageProps extends Omit<UIKitTokenPairImageProps, 'primarySrc' | 'secondarySrc'> {
  chainId:number,
  primaryToken: Token
  secondaryToken: Token
}

const getImageUrlFromToken = (chainId:number, token: Token) => {
  const address = getAddress(chainId, token.symbol === NETWORK_CCY[chainId].symbol ? tokens.wbnb.address : token.address)
  return `/images/tokens/${address}.svg`
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
  chainId:number,
  token: Token
}

export const TokenImage: React.FC<TokenImageProps> = ({ chainId, token, ...props }) => {
  return <UIKitTokenImage src={getImageUrlFromToken(chainId, token)} {...props} />
}
