import { createGlobalStyle } from 'styled-components'
// eslint-disable-next-line import/no-unresolved
import { PancakeTheme } from '@requiemswap/uikit/dist/theme'

declare module 'styled-components' {
  /* eslint-disable @typescript-eslint/no-empty-interface */
  export interface DefaultTheme extends PancakeTheme {}
}

const GlobalStyle = createGlobalStyle`
  * {
    font-family: 'Open Sans', sans-serif;
  }
  body {
    background-color:  ${({ theme }) => theme.colors.background};;

    img {
      height: auto;
      max-width: 100%;
    }
  }
  #background-video {
    opacity: 0.2;
    width: 100vw;
    height: 100vh;
    object-fit: cover;
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: -1;
}
`

export default GlobalStyle
