import { Button } from "@chakra-ui/button"
import Image from 'next/image'
import { Box, VStack, Text } from "@chakra-ui/layout"
import NFTBg from '@public/nft_bg.png';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/modal";
import { useAccount, useConnect, useContractRead, useContractWrite, useProvider, useWaitForTransaction } from "@starknet-react/core";
import { Avatar, useDisclosure, Center, Spinner, HStack } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { levelsAtom, statsAtom, userDataAtom, userSTRKEarnedAtom } from "@/state.atoms";
import { LearnMoreLink, isClaimable, isIneligible, isIntractUser } from "@/utils";
import { BlockTag, Contract } from "starknet";
import NFTABI from '@public/nft.abi.json';
import { isMobile } from "react-device-detect";

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
    const { provider } = useProvider();
    const [{ data, isPending, isError }] = useAtom(userDataAtom)
    const [{ data: dataStats, isPending: isPendingStats, isError: isErrorStats }] = useAtom(statsAtom)
    const [mintDone, setMintDone] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure()
    const { isOpen: isOpenEligible, onOpen: onOpenEligible, onClose: onCloseEligible } = useDisclosure()
    const { isOpen: isOpenIntract, onOpen: onOpenIntract, onClose: onCloseIntract } = useDisclosure()
    const { isOpen: isOpenMintComplete, onOpen: onOpenMintComplete, onClose: onCloseMintComplete } = useDisclosure()
    const { isOpen: isOpenImage, onOpen: onOpenImage, onClose: onCloseImage } = useDisclosure()
    const [checkEligibility, setCheckEligibility] = useState(false);

    const calls = useMemo(() => {
        if (!data || !process.env.NEXT_PUBLIC_CONTRACT) return []
        console.log('data', data)
        const contract = new Contract(NFTABI, process.env.NEXT_PUBLIC_CONTRACT, provider);
        const call = contract.populate("mint", {
            nftId: props.level,
            rewardEarned: data?.signStrkAmount, 
            hash: data?.hash, 
            signature: data?.sig
        });
        return [call];
    }, [provider, data])
    const { writeAsync, isPending: isPendingTx, data: dataTx} = useContractWrite({
        calls
    })

    const { isLoading: isLoadingTx, isError: isErrorTx, error: errorTx, data: dataTxStatus } = useWaitForTransaction({hash: dataTx?.transaction_hash, watch: true})

    useEffect(() => {
        console.log('tx status', dataTxStatus, isLoadingTx, isErrorTx)
        if (dataTxStatus) {
            if (dataTxStatus.statusReceipt == 'success' && !mintDone) {
                onOpenMintComplete();
                setMintDone(true);
            }
        }
    }, [dataTxStatus, isLoadingTx, isErrorTx])
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

    const { data: dataIsClaimed, isError: isErrorClaimed, isLoading: isLoadingClaimed, error } = useContractRead({
        functionName: "balanceOf",
        args: [address as string, props.level],
        abi: NFTABI,
        address: process.env.NEXT_PUBLIC_CONTRACT || '',
        watch: true,
        blockIdentifier: BlockTag.pending
    })

    const isTxSettling = useMemo(() => {
        return ((dataTx?.transaction_hash && isLoadingTx) || isPendingTx) ? true : false
    }, [dataTx, isLoadingTx, isPendingTx])

    function buttonText() {
        if (Number(dataIsClaimed) > 0) {
            return "Claimed"
        }
        return <>{!address && props.isClaimable ? "Connect" : "Mint NFT"} {isTxSettling && <Spinner size='sm' marginLeft='10px'/>}</>
    }

    return <Box 
        width={'100%'} 
        borderColor={'dark'} borderWidth={'1px'}
        padding='15px'
        borderRadius={'10px'}
        backgroundImage={props.isClaimable ? NFTBg.src : ''}
        backgroundRepeat={'no-repeat'}
        backgroundSize={'cover'}
    >   
        <Image src={props.image} alt={`NFT ${props.level}`} 
            width={200}
            height={266.81}
            style={{
                width: '100%',
                height: 'auto',
                filter: props.isClaimable ? 'none' : 'grayscale(1) blur(7px) brightness(0.5)',
                cursor: 'pointer'
            }}
            onClick={() => props.isClaimable && onOpenImage()}
        />
        <Text color='white' textAlign='center' margin={'15px 0'}>Level {props.level}</Text>
        {isMobile && <Text color='primary' fontWeight={'bold'} fontSize='18px' textAlign='center' margin={'15px 0'}>{levels.filter(l => l.id == props.level)[0].amountSTRK.toLocaleString()} STRK</Text>}
        {!isMobile && <Button 
            width={'100%'} 
            disabled={
                (
                    props.isClaimable && 
                    (!address || 
                        (Number(dataIsClaimed) == 0 && !isTxSettling)
                    )
                ) 
                ? false : true}
            variant={(props.isClaimable && (!address || (Number(dataIsClaimed) == 0 && !isTxSettling))) ? 'base' : 'disabled'}
            onClick={() => {
                if (props.isClaimable && !address) {
                    onOpen();
                } else if (props.isClaimable) {
                    writeAsync();
                }
            }}
        >   
            {buttonText()}          
        </Button>}

        {/* wallet popup */}
        <Modal isOpen={isOpen} onClose={onCloseWalletConnect}>
            <ModalOverlay bg='blackAlpha.300'
                backdropFilter='auto'
                backdropBlur='5px'/>
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


        {/* inage popup */}
        <Modal isOpen={isOpenImage} onClose={() => {}}>
            <ModalOverlay bg='blackAlpha.300'
                backdropFilter='auto'
                backdropBlur='5px'/>
            <ModalContent bg='bg' borderColor={'white'} borderWidth={'1px'} 
                borderRadius={'10px'}  maxWidth={'700px'} width={'100%'}>
                <ModalCloseButton color='bg_light' onClick={onCloseImage} />
                <ModalBody padding={'40px 40px'}>
                    <Image src={props.image} alt={`NFT ${props.level}`}
                        width={1000}
                        height={1334.04}
                        style={{
                            width: '100%',
                            height: 'auto',
                            filter: 'none'
                        }}
                    />
                </ModalBody>
            </ModalContent>
        </Modal>

        {/* ineligible popup */}
        <Modal isOpen={isOpenEligible} onClose={() => {}}>
            <ModalOverlay bg='blackAlpha.300'
                backdropFilter='auto'
                backdropBlur='5px'/>
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

        {/* interact level 2 users*/}
        <Modal isOpen={isOpenIntract} onClose={() => {}}>
            <ModalOverlay bg='blackAlpha.300'
                backdropFilter='auto'
                backdropBlur='5px'/>
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

        {/* Mint complete */}
        <Modal isOpen={isOpenMintComplete} onClose={() => {}}>
            <ModalOverlay 
                bg='blackAlpha.300'
                backdropFilter='auto'
                backdropBlur='5px'
            />
            <ModalContent bg='bg' borderColor={'white'} borderWidth={'1px'} borderRadius={'10px'}  minWidth={'1000px'}>
                <ModalBody padding={'40px 80px'}>
                    <Text 
                        color='primary'
                        textAlign={'center'} 
                        fontSize={'49px'} 
                        className={'nbe-font'}
                        lineHeight={'100%'}
                        letterSpacing={'2.4px'}
                    >MINT COMPLETE</Text>
                    <hr color='var(--chakra-colors-blue)' className="marginV20"/>
                    <HStack spacing={5} width='100%'>
                        {
                            levels.map((level) => (
                                <Image 
                                    width={200}
                                    height={266.81}
                                    src={level.nftSrc}
                                    key={level.id}
                                    alt={'NFT ' + level.id}
                                    onClick={() => {
                                        if(isClaimable(
                                            address, userSTRK, level, levels, data
                                        )) {
                                            onCloseMintComplete()
                                            onOpenImage()
                                        }
                                    }}
                                    style={{
                                        width: '23.2%',
                                        height: 'auto',
                                        filter: isClaimable(
                                            address, userSTRK, level, levels, data
                                        ) ? 'none' : 'grayscale(1) blur(7px) brightness(0.5)',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))
                        }
                    </HStack>
                    <hr className="marginV20"/>
                    {/* level 4 < */}
                    {props.level < 4 && <>
                        <Text 
                            color='bg_light'
                            textAlign={'center'} 
                            fontSize={'14px'} 
                            marginBottom={'10px'}
                        >YOU REACHED</Text>
                        <Text 
                            color='primary'
                            textAlign={'center'} 
                            fontSize={'48px'} 
                            className={'nbe-font'}
                            lineHeight={'100%'}
                            letterSpacing={'2.4px'}
                        >LEVEL {props.level}</Text>
                        <hr color='var(--chakra-colors-blue)' className="marginV20"/>
                    </>}

                    {/* levle 4 */}
                    {props.level == 4 && <HStack>
                        <Box width='50%'>
                            <Text color='bg_light' fontSize={'14px'} textAlign={'center'}>PARTICIPANTS</Text>
                            <Text color='blue_text' fontWeight={'700'} fontSize={'48px'} textAlign={'center'}>{dataStats ? dataStats.totalParticipants.toLocaleString() : (isPendingStats ? <Spinner size='sm'/> : 'Err')}</Text>
                        </Box>
                        <Box width='50%'>
                            {/* TODO ADD TVL */}
                            <Text color='bg_light' fontSize={'14px'} textAlign={'center'}>STARKNET TVL</Text>
                            <Text color='blue_text' fontWeight={'700'} fontSize={'48px'} textAlign={'center'}>${dataStats ? dataStats.tvl : (isPendingStats ? <Spinner size='sm'/> : 'Err')}</Text>
                        </Box>
                    </HStack>}
                    <Center width={'100%'}>
                        <Button variant='base' as='a' href={LearnMoreLink()} target="_blank" width='150px'>Learn more</Button>
                        {props.level < 4 && <Button variant='base' marginLeft={'20px'} width='150px' onClick={onCloseMintComplete}>Return</Button>}
                    </Center>
                </ModalBody>
            </ModalContent>
        </Modal>
    </Box>
}