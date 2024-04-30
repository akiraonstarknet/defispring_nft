"use client";

import { Box, Button, Flex, Container, Heading, VStack, Image, Stat, Text, HStack, Tooltip, Spinner } from '@chakra-ui/react'
import Image1 from '@public/image1.png'
import StarknetPresentsSvg from '@public/starknet_presents.svg'
import DefiSpringSvg from '@public/defi_spring.svg'
import ProgressBar from '@/components/ProgressBar';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { accountAtom, levelsAtom, userDataAtom, userSTRKEarnedAtom } from '@/state.atoms';
import ConnectBtn from '@/components/ConnectBtn';
import NFTCard from '@/components/NFTCard';
import { useAccount } from '@starknet-react/core';
import { useEffect } from 'react';
import { isIntractUser } from '@/utils';

export default function Home() {
  const levels = useAtomValue(levelsAtom);
  const strkEarned = useAtomValue(userSTRKEarnedAtom);
  const {address} = useAccount();
  const setAccountAtom = useSetAtom(accountAtom);
  const [{ data, isPending, isError }] = useAtom(userDataAtom)
  
  useEffect(() => {
    setAccountAtom(address);
  }, [address])

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
          <Heading color='white' textAlign={'left'} marginBottom={'15px'} 
          className='nbe-font' fontSize={'24px'}>STATS</Heading>
          <VStack 
            spacing='7'
            borderWidth={'1px'} 
            borderColor={'white'} 
            borderRadius={'10px'} 
            padding={'20px'}
          >
            {address && <Flex width={'100%'}>
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
            {!address && <Text color='bg_light' fontSize={'16px'}>Connect wallet to view your STRK</Text>}
            <ProgressBar/>
            <HStack spacing={5} width='100%'>
              {
                levels.map((level) => (
                  <NFTCard 
                    key={level.id}
                    level={level.id} 
                    image={level.nftSrc} 
                    isClaimable={
                      (!address && level.id == 1) ||
                      (address != undefined && level.amountSTRK <= strkEarned) ||
                      (!!data && isIntractUser(data, strkEarned, levels) && level.id <= 2)
                    }
                  ></NFTCard>
                ))
              }
            </HStack>
            {isError && <Text color='red'>Error fetching data. Please refresh and try again.</Text>}
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
