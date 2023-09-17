import { ArrowLeftIcon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import {
  Button,
  Card,
  Container,
  Flex,
  Heading,
  IconButton,
  Popover,
  Select,
  Slider,
  Text,
  TextFieldInput,
} from "@radix-ui/themes";
import React, { useCallback, useMemo, useState } from "react";
import {
  METADATA_STANDARD_PROGRAM_ID,
  builders,
  createExternalMetadataData,
} from "@koch-labs/metadata-standard";
import {
  RENT_NFT_PROGRAM_ID,
  createCollection,
  getConfigKey,
  builders as rentBuilders,
} from "@koch-labs/rent-nft";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  Keypair,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createMintToInstruction,
  createInitializeMintInstruction,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Token, tokens } from "../../utils/tokens";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import Link from "next/link";
import { useUser } from "../../contexts/UserContextProvider";

const CreateSaloon: React.FC = () => {
  const router = useRouter();
  const wallet = useWallet();
  const { isSignedIn, token } = useUser();
  const { connection } = useConnection();
  const provider = useMemo(
    () =>
      wallet ? new AnchorProvider(connection, wallet as any, {}) : undefined,
    [wallet, connection]
  );

  const [name, setName] = useState<string>();
  const [taxToken, setTaxToken] = useState<Token>(tokens[0]);
  const [taxRate, setTaxRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Container className="content-center">
      <Flex gap="2" direction="column">
        <Flex align="start" justify="between">
          <Link href="/saloons">
            <IconButton variant="ghost">
              <ArrowLeftIcon width={32} height={32} strokeWidth={5} />
            </IconButton>
          </Link>
          <Card>
            <Flex>
              <Heading>Saloon {router.query.mint}</Heading>
            </Flex>
          </Card>
          <Popover.Root>
            <Popover.Trigger>
              <IconButton variant="ghost">
                <QuestionMarkCircledIcon
                  width={32}
                  height={32}
                  strokeWidth={5}
                />
              </IconButton>
            </Popover.Trigger>
            <Popover.Content style={{ width: 360 }}>
              <Flex gap="3" direction="column">
                <Text size="5">What are Saloons ?</Text>
                <Text size="2">
                  Saloons are digital spaces that only subscribers can access.
                  <br />
                  The number of of available subscriptions can be increased at
                  any time, but only a subscriber can burn a subscription so be
                  carefull before minting too many.
                </Text>
                <Popover.Close>
                  <Button size="1">OK</Button>
                </Popover.Close>
              </Flex>
            </Popover.Content>
          </Popover.Root>
        </Flex>
      </Flex>
    </Container>
  );
};

export default CreateSaloon;
