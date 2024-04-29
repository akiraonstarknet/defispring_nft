import { Button } from "@chakra-ui/button";
import { Box, BoxProps } from "@chakra-ui/layout";

interface ConnectBtnProps {
    boxProps: BoxProps
}

export default function ConnectBtn(props: ConnectBtnProps) {
    return <Box {...props.boxProps}>
        <Button float={'right'} variant={'blue'} padding={'6px 15px'}>0xab...23d3</Button>
    </Box>
}