import { levelsAtom } from "@/state.atoms";
import { Box, Center, Flex, HStack, Text, VStack } from "@chakra-ui/layout";
import { Progress } from "@chakra-ui/progress";
import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";

export default function ProgressBar() {
    const [levels, _] = useAtom(levelsAtom);
    return <Box width={'100%'}>
        <Progress 
            value={80}
            bg={'bg'} 
            colorScheme="primarySchema"
            borderColor={'blue'} 
            borderWidth={'1px'} 
            isAnimated={true} 
            width={'100%'}
        />
        <Flex width={'100%'} marginTop='-11px' zIndex={10000} position={'relative'}>
            {levels.map((level) => ( 
                <VStack key={level.id} width={"25%"}>
                    {/* Gives the separator on progress bar */}
                    <Box width='1px' height='10px' bg='blue'></Box>
                    <Text color="primary">{level.amountSTRK} STRK</Text>
                </VStack>
            ))}
        </Flex>
    </Box>
}