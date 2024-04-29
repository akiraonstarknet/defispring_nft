import { Button } from "@chakra-ui/button";
import { Box, BoxProps } from "@chakra-ui/layout";

interface ConnectBtnProps {
    boxProps: BoxProps
}

export default function ConnectBtn(props: ConnectBtnProps) {
    return <Box {...props.boxProps}>
        <Button float={'right'} variant={'base'} padding={'6px 25px'}>Connect</Button>
    </Box>
}