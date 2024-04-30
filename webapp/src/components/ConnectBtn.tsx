import { Button } from "@chakra-ui/button";
import { SmallCloseIcon } from "@chakra-ui/icons";
import { Box, BoxProps } from "@chakra-ui/layout";
import { Avatar, useDisclosure, IconButton, Tooltip } from "@chakra-ui/react";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useState } from "react";
import { num } from "starknet";

interface ConnectBtnProps {
    boxProps: BoxProps
}

export function shortAddress(_address: string) {
  const x = num.toHex(num.getDecimalString(_address));
  return `${x.slice(0, 4)}...${x.slice(x.length - 4, x.length)}`;
}

export default function ConnectBtn(props: ConnectBtnProps) {
    const { address } = useAccount();
    const { disconnect } = useDisconnect();
    if (!address) {
      return <Box {...props.boxProps}></Box>
    }

    return <Box {...props.boxProps}>
      <Tooltip label="Disconnect">
        <Button float={'right'} 
          variant={'blue'} padding={'6px 15px'}
          onClick={() => {
            disconnect()
          }}
        >
          {shortAddress(address)}
        </Button>
      </Tooltip>
    </Box>
}