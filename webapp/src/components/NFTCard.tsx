import { Button } from "@chakra-ui/button"
import { Image } from "@chakra-ui/image"
import { Box, VStack, Text } from "@chakra-ui/layout"
import NFTBg from '@public/nft_bg.png';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/modal";
import { useAccount, useConnect } from "@starknet-react/core";
import { Avatar, useDisclosure, Center } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { levelsAtom, userDataAtom, userSTRKEarnedAtom } from "@/state.atoms";
import { isIneligible, isIntractUser } from "@/utils";

interface NFTCardProps {
    level: number,
    image: string,
    isClaimable: boolean
}

export function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function NFTCard(props: NFTCardProps) {
    const { address } = useAccount();
    const levels = useAtomValue(levelsAtom);
    const userSTRK = useAtomValue(userSTRKEarnedAtom)
    const { connect, connectors } = useConnect();
    const [{ data, isPending, isError }] = useAtom(userDataAtom)

    const { isOpen, onOpen, onClose } = useDisclosure()
    const { isOpen: isOpenEligible, onOpen: onOpenEligible, onClose: onCloseEligible } = useDisclosure()
    const { isOpen: isOpenIntract, onOpen: onOpenIntract, onClose: onCloseIntract } = useDisclosure()
    const [checkEligibility, setCheckEligibility] = useState(false);

    const onCloseWalletConnect = () => {
        onClose()
        setCheckEligibility(true);
    }

    useEffect(() => {
        if (address && checkEligibility && data) {
            if (isIntractUser(data, userSTRK, levels)) {
                onOpenIntract();
                setCheckEligibility(false);
            } else if (isIneligible(userSTRK, levels)) {
                onOpenEligible();
                setCheckEligibility(false);
            }
        }
    }, [checkEligibility, address, userSTRK, data])

    useEffect(() => {
        if (!address) return;

        
    }, [address])

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
            <Button 
                width={'100%'} 
                variant={props.isClaimable ? 'base' : 'disabled'}
                onClick={() => {
                    if (props.isClaimable && !address) {
                        onOpen();
                    } else if (props.isClaimable) {
                        // mintNFT();
                    }
                }}
            >
                Mint NFT
            </Button>
        </VStack>

        {/* wallet popup */}
        <Modal isOpen={isOpen} onClose={onCloseWalletConnect}>
            <ModalOverlay />
            <ModalContent bg='bg' borderColor={'white'} borderWidth={'1px'} borderRadius={'10px'}  minWidth={'550px'}>
                <ModalCloseButton color='bg_light' onClick={onClose} />
                <ModalBody padding={'40px 80px'}>
                    <Text color='primary' textAlign={'center'} fontSize={'25px'} className={'nbe-font'}>CONNECT WALLET</Text>
                    <Text color='bg_light' 
                        textAlign={'center'} 
                        fontSize={'14px'}
                        marginBottom={'10px'}
                    >PLEASE SELECT WALLET</Text>
                    {connectors.map(conn => (
                    <Button key={conn.name} width={'100%'} marginTop={'10px'}
                        color={'white'}
                        borderColor={'blue'}
                        borderWidth={'1px'}
                        borderRadius={'5px'}
                        bg='bg'
                        padding={'30px 25px'}

                        _hover={{
                            bg: 'blue'
                        }}

                        onClick={() => {
                            connect({ connector: conn });
                            onCloseWalletConnect();
                        }}
                    >
                        <Avatar
                        src={conn.icon.light}
                        size={'2xs'}
                        marginRight={'5px'}
                    />
                    {capitalize(conn.name)}
                    </Button>
                    ))}
                </ModalBody>
            </ModalContent>
        </Modal>

        {/* ineligible popup */}
        <Modal isOpen={isOpenEligible} onClose={() => {}}>
            <ModalOverlay />
            <ModalContent bg='bg' borderColor={'white'} borderWidth={'1px'} borderRadius={'10px'}  minWidth={'550px'}>
                <ModalBody padding={'40px 80px'}>
                    <Text 
                        color='primary'
                        textAlign={'center'} 
                        fontSize={'40px'} 
                        className={'nbe-font'}
                        lineHeight={'100%'}
                        letterSpacing={'2.4px'}
                    >INELIGIBLE FOR MINTING</Text>
                    <hr color='var(--chakra-colors-blue)' className="marginV20"/>
                    <Text color='white' 
                        textAlign={'center'} 
                        fontSize={'18px'}
                        marginBottom={'10px'}
                        lineHeight={'130%'}
                        letterSpacing={'1.2px'}
                        className={'nbe-font'}
                    >{"You can mint this NFT once you have earned enough STRK. Earn STRK through DeFi Spring here".toUpperCase()}</Text>
                    <hr color='var(--chakra-colors-blue)' className="marginV20"/>
                    <Center><Button variant='base' onClick={onCloseEligible}>Continue</Button></Center>
                </ModalBody>
            </ModalContent>
        </Modal>

        {/* interact level 2 users // todo do not show if already >= level 2 or has enogh level 2 amount*/}
        <Modal isOpen={isOpenIntract} onClose={() => {}}>
            <ModalOverlay />
            <ModalContent bg='bg' borderColor={'white'} borderWidth={'1px'} borderRadius={'10px'}  minWidth={'550px'}>
                <ModalBody padding={'40px 80px'}>
                    <Text 
                        color='bg_light'
                        textAlign={'center'} 
                        fontSize={'14px'} 
                        marginBottom={'10px'}
                    >YOU REACHED</Text>
                    <Text 
                        color='primary'
                        textAlign={'center'} 
                        fontSize={'40px'} 
                        className={'nbe-font'}
                        lineHeight={'100%'}
                        letterSpacing={'2.4px'}
                    >LEVEL 2</Text>
                    <hr color='var(--chakra-colors-blue)' className="marginV20"/>
                    <Text color='white' 
                        textAlign={'center'} 
                        fontSize={'18px'}
                        marginBottom={'10px'}
                        lineHeight={'130%'}
                        letterSpacing={'1.2px'}
                        className={'nbe-font'}
                    >{"You are auto-qualified for Level 2 for previously completing a Quest on intract".toUpperCase()}</Text>
                    <hr color='var(--chakra-colors-blue)' className="marginV20"/>
                    <Center width={'100%'}><Button variant='base' onClick={onCloseIntract}>Continue</Button></Center>
                </ModalBody>
            </ModalContent>
        </Modal>
    </Box>
}