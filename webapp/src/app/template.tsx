'use client';

import * as React from 'react';

import { sepolia } from '@starknet-react/chains';
import {
  StarknetConfig,
  argent,
  braavos,
  useInjectedConnectors,
  jsonRpcProvider,
} from '@starknet-react/core';
import {
  background,
  ChakraBaseProvider,
  extendTheme,
  StyleFunctionProps,
} from '@chakra-ui/react';
import { RpcProviderOptions, constants } from 'starknet';

const theme = extendTheme({
    colors: {
        bg: '#000',
        bg_light: '#7D7D7D',
        primary: '#DE4050',
        primary_light: '#F19CA5',
        white: '#F3F4F6',
        dark: '#404040',
        blue: '#4D4B87',
        blue_text: '#6F89DF',
        blue_50p: 'rgba(77, 75, 135, 0.5)',
        disabled_dark: '#404040',
        disabled_light: '#9A9A9A',
        primarySchema: {
          50: '#ffe5e9',
          100: '#f9bcc2',
          200: '#ee919a',
          300: '#e66674',
          400: '#dd3b4c',
          500: '#c42232',
          600: '#991827',
          700: '#6e101b',
          800: '#44070f',
          900: '#1e0003',
        }
    },
    components: {
        Button: {
            baseStyle: {
                background: 'primary',
                color: 'white',
                borderRadius: '5px',
                borderWidth: '1px',
                borderColor: 'primary_light',
                padding: '6px 40px',
                fontWeight: 'normal'
            },
            variants: {
                disabled: {
                    background: 'disabled_dark',
                    color: 'disabled_light',
                    borderColor: 'disabled_light'
                },
                blue: {
                    background: 'blue_50p',
                    color: 'blue_text',
                    borderColor: 'blue',

                    _hover: {
                      background: "blue"
                    }
                }
            }
        },
    },
    styles: {
        global: (props: StyleFunctionProps) => ({
        body: {
            fontFamily: 'body',
        }
        })
    }
});

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export default function Template({ children }: { children: React.ReactNode }) {
  const chains = [sepolia];
  const provider = jsonRpcProvider({
    rpc: (chain) => {
      const args: RpcProviderOptions = {
        nodeUrl:
          'url',
        chainId: constants.StarknetChainId.SN_MAIN,
      };
      return args;
    },
  });
  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [braavos(), argent()],
    // Hide recommended connectors if the user has any connector installed.
    includeRecommended: 'onlyIfNoConnectors',
    // Randomize the order of the connectors.
    order: 'alphabetical',
  });

  return (
      <StarknetConfig
        chains={chains}
        provider={provider}
        connectors={connectors}
      >
        <ChakraBaseProvider theme={theme}>
          <React.Suspense>{children}</React.Suspense>
        </ChakraBaseProvider>
      </StarknetConfig>
  );
}
