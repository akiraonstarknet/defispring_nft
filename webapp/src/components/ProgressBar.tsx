import { levelsAtom, userSTRKEarnedAtom } from "@/state.atoms";
import { Box, Center, Flex, HStack, Text, VStack } from "@chakra-ui/layout";
import { Progress } from "@chakra-ui/progress";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";

export default function ProgressBar() {
    const [levels, _] = useAtom(levelsAtom);
    const userSTRK = useAtomValue(userSTRKEarnedAtom);

    const value = useMemo(() => {
        for(let i=0; i<levels.length; ++i) {
            const lvl = levels[i];
            if (userSTRK <= lvl.amountSTRK) {
                if (i == 0) {
                    return (userSTRK / lvl.amountSTRK) * 12.5;
                }
                return 25 * (i - 1) + (userSTRK / lvl.amountSTRK) * 25 + 12.5;
            }
        }
        return 100;
    }, [levels])
    return <Box width={'100%'}>
        <Progress 
            value={value}
            bg={'bg'} 
            colorScheme="primarySchema"
            borderColor={'blue'} 
            borderWidth={'1px'} 
            isAnimated={true} 
            width={'100%'}
        />
        <Flex width={'100%'} marginTop='-11px' zIndex={100} position={'relative'}>
            {levels.map((level) => ( 
                <VStack key={level.id} width={"25%"}>
                    {/* Gives the separator on progress bar */}
                    <Box width='1px' height='10px' bg='blue'></Box>
                    <Text color="primary">{level.amountSTRK.toLocaleString()} STRK</Text>
                </VStack>
            ))}
        </Flex>
    </Box>
}