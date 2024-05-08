"use client";

import { Box, Button, Flex, Container, Heading, VStack, Image, Stat, Text, HStack, Tooltip, Spinner, Stack } from '@chakra-ui/react'
import Image1 from '@public/image1.png'
import StarknetPresentsSvg from '@public/starknet_presents.svg'
import DefiSpringSvg from '@public/defi_spring.svg'
import ProgressBar from '@/components/ProgressBar';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { accountAtom, levelsAtom, userDataAtom, userSTRKEarnedAtom } from '@/state.atoms';
import ConnectBtn from '@/components/ConnectBtn';
import NFTCard from '@/components/NFTCard';
import { useAccount } from '@starknet-react/core';
import { useEffect, useMemo } from 'react';
import { LearnMoreLink, isClaimable, isIntractUser } from '@/utils';
import { num } from 'starknet';
import { isMobile } from 'react-device-detect';

export default function Home() {
  const levels = useAtomValue(levelsAtom);
  const strkEarned = useAtomValue(userSTRKEarnedAtom);
  const {address, chainId} = useAccount();
  const setAccountAtom = useSetAtom(accountAtom);
  const [{ data, isPending, isError }] = useAtom(userDataAtom)
  
  const isCorrectChain = useMemo(() => {
    console.log('chain', num.getHexString(chainId?.toString() || '0'), process.env.NEXT_PUBLIC_CHAIN_ID, parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "0"))
    return num.getHexString(chainId?.toString() || '0') == (process.env.NEXT_PUBLIC_CHAIN_ID || "0x");
  }, [chainId])

  useEffect(() => {
    setAccountAtom(address);
  }, [address])

  return (
    <Container bg='bg' width='100%' maxWidth={'100%'} padding={{base: '70px 20px', lg: '70px 75px'}}>
      <VStack maxWidth={'100%'} margin={'0 auto'} spacing={10}>

        {/* // Head */}
        <VStack width={'100%'}>
          <Image src={StarknetPresentsSvg.src} alt="Starknet presents" width={'300px'}/>
          <Image src={DefiSpringSvg.src} alt="DeFi Spring" width={'350px'}/>
        </VStack>
        <Button variant={'base'} padding={'6px 35px'} as='a' href={LearnMoreLink()} target='_blank'>Learn More</Button>
        <Image src={Image1.src} alt="Master image" width={'100%'}/>

        {/* Claim component */}
        <Box width={'100%'} maxWidth={'800px'}>
          <Heading color='white' textAlign={'left'} marginBottom={'15px'} 
          className='nbe-font' fontSize={'24px'}>STATS</Heading>
          <VStack 
            spacing='7'
            borderWidth={'1px'} 
            borderColor={'white'} 
            borderRadius={'10px'} 
            padding={'20px'}
          >
            {address && isCorrectChain && <Flex width={'100%'}>
              <Tooltip label='Only claimed STRK is indicated' placement='bottom-start'>
                <Box width={'50%'}>
                  <Text color='blue_text' fontSize={'16px'}>Total STRK earned</Text>
                  
                    <Text color='primary' fontSize={'50px'}
                      fontWeight={'bold'}
                      marginTop={'-15px'}>
                      {isPending ? <Spinner/> : parseInt(strkEarned.toFixed(2)).toLocaleString()}
                    </Text>
                </Box>
              </Tooltip>
              <ConnectBtn boxProps={{
                width: '50%',
              }}/>
            </Flex>}
            {isMobile && <Text color='bg_light' fontSize={'16px'}>Desktop browser only</Text>}
            {!address && !isMobile && <Text color='bg_light' fontSize={'16px'}>Connect wallet to view your STRK</Text>}
            {address && !isCorrectChain && <Text color='bg_light' fontSize={'16px'}>Ensure you are on {process.env.NEXT_PUBLIC_CHAIN_NAME} network.</Text>}
            {!isMobile && <ProgressBar/>}
            <Stack direction={{base: 'column', sm: 'row'}} spacing={5} width='100%'>
              {
                levels.map((level) => (
                  <NFTCard 
                    key={level.id}
                    level={level.id} 
                    image={level.nftSrc} 
                    isClaimable={
                      // setting true on mobile, shows all images but no claim otpion
                      isClaimable(address, strkEarned, level, levels, data) || isMobile
                    }
                  ></NFTCard>
                ))
              }
            </Stack>
            {isError && <Text color='red'>Error fetching data. Please refresh and try again.</Text>}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
