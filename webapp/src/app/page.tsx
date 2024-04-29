"use client";

import { Box, Button, Flex, Container, Heading, VStack, Image, Stat, StatLabel, StatNumber, StatHelpText, HStack } from '@chakra-ui/react'
import Image1 from '@public/image1.png'
import StarknetPresentsSvg from '@public/starknet_presents.svg'
import DefiSpringSvg from '@public/defi_spring.svg'
import ProgressBar from '@/components/ProgressBar';
import { useAtomValue } from 'jotai';
import { levelsAtom, userSTRKEarnedAtom } from '@/state.atoms';
import ConnectBtn from '@/components/ConnectBtn';
import NFTCard from '@/components/NFTCard';

export default function Home() {
  const levels = useAtomValue(levelsAtom);
  const strkEarned = useAtomValue(userSTRKEarnedAtom);

  return (
    <Container bg='bg' width='100%' maxWidth={'100%'} padding={"70px 75px"}>
      <VStack maxWidth={'100%'} margin={'0 auto'} spacing={10}>

        {/* // Head */}
        <VStack width={'100%'}>
          <Image src={StarknetPresentsSvg.src} alt="Starknet presents" width={'300px'}/>
          <Image src={DefiSpringSvg.src} alt="DeFi Spring" width={'350px'}/>
        </VStack>
        <Button variant={'base'} padding={'6px 35px'}>Learn More</Button>
        <Image src={Image1.src} alt="Master image" width={'100%'}/>

        {/* Claim component */}
        <Box width={'100%'} maxWidth={'800px'}>
          <Heading color='white' textAlign={'left'} marginBottom={'15px'}>STATS</Heading>
          <VStack 
            spacing='7'
            borderWidth={'1px'} 
            borderColor={'white'} 
            borderRadius={'10px'} 
            padding={'20px'}
          >
            <Flex width={'100%'}>
              <Stat width={'60%'}>
                <StatLabel color='blue_text' fontSize={'16px'}>Total STRK earned</StatLabel>
                <StatNumber color='primary' fontSize={'50px'}
                  fontWeight={'bold'}
                  marginTop={'-15px'}>
                  {strkEarned}
                </StatNumber>
              </Stat>
              <ConnectBtn boxProps={{
                width: '30%',
              }}/>
            </Flex>
            <ProgressBar/>
            <HStack spacing={5} width='100%'>
              {
                levels.map((level) => (
                  <NFTCard 
                    level={level.id} 
                    image={level.nftSrc} 
                    isClaimable={level.id <= 2}
                  ></NFTCard>
                ))
              }
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
