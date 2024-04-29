import { Button } from "@chakra-ui/button"
import { Image } from "@chakra-ui/image"
import { Box, VStack, Text } from "@chakra-ui/layout"
import NFTBg from '@public/nft_bg.png';

interface NFTCardProps {
    level: number,
    image: string,
    isClaimable: boolean
}

export default function NFTCard(props: NFTCardProps) {
    return <Box 
        width={'100%'} 
        borderColor={'dark'} borderWidth={'1px'}
        padding='15px'
        borderRadius={'10px'}
        backgroundImage={props.isClaimable ? NFTBg.src : ''}
        backgroundRepeat={'no-repeat'}
        backgroundSize={'cover'}
    >   
        <VStack spacing={5}>
            <Image src={props.image} alt={`NFT ${props.level}`} width={'100%'}
                filter={props.isClaimable ? 'none' : 'grayscale(1) blur(7px) brightness(0.5)'}
            />
            <Text color='white' textAlign='center'>Level {props.level}</Text>
            <Button width={'100%'} variant={props.isClaimable ? 'base' : 'disabled'}>Mint NFT</Button>
        </VStack>
    </Box>
}