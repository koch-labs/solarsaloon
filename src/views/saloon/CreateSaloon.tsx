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
  TextArea,
  TextFieldInput,
} from "@radix-ui/themes";
import React, { useCallback, useMemo, useState } from "react";
import {
  builders,
  createExternalMetadataData,
} from "@koch-labs/metadata-standard";
import { builders as rentBuilders } from "@koch-labs/rent-nft";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  getAssociatedTokenAddressSync,
  createMintToCheckedInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import { Token, tokens } from "../../utils/tokens";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import Link from "next/link";
import numeral from "numeral";
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
  const [description, setDescription] = useState<string>();
  const [taxToken, setTaxToken] = useState<Token>(tokens[0]);
  const [taxRate, setTaxRate] = useState<number>(Math.log10(10000));
  const [postCooldown, setPostCooldown] = useState<number>(86400000);
  const [isLoading, setIsLoading] = useState(false);

  const formattedTime = useMemo(() => {
    const seconds = postCooldown / 1000;
    if (seconds < 60) {
      return `${numeral(seconds).format("0.0a")} seconds`;
    }

    const minutes = seconds / 60;
    if (minutes < 60) {
      return `${numeral(minutes).format("0.0a")} minutes`;
    }

    const hours = minutes / 60;
    if (hours < 24) {
      return `${numeral(hours).format("0.0a")} hours`;
    }

    const days = hours / 24;
    return `${numeral(days).format("0.0a")} days`;
  }, [postCooldown]);

  const handleCreate = useCallback(async () => {
    if (!provider || !wallet.sendTransaction || !wallet.publicKey || !name)
      return;

    setIsLoading(true);
    try {
      const collectionMintKeypair = Keypair.generate();
      const txs: Transaction[] = [];
      const {
        value: { blockhash, lastValidBlockHeight },
        context: { slot },
      } = await connection.getLatestBlockhashAndContext();

      const tx = new Transaction();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;

      const space = getMintLen([]);
      tx.add(
        SystemProgram.createAccount({
          newAccountPubkey: collectionMintKeypair.publicKey,
          space,
          fromPubkey: wallet.publicKey,
          lamports: await connection.getMinimumBalanceForRentExemption(space),
          programId: TOKEN_2022_PROGRAM_ID,
        })
      );
      tx.add(
        createInitializeMintInstruction(
          collectionMintKeypair.publicKey,
          0,
          wallet.publicKey,
          wallet.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      );
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          wallet.publicKey,
          getAssociatedTokenAddressSync(
            collectionMintKeypair.publicKey,
            wallet.publicKey,
            true,
            TOKEN_2022_PROGRAM_ID
          ),
          wallet.publicKey,
          collectionMintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      );
      tx.add(
        createMintToCheckedInstruction(
          collectionMintKeypair.publicKey,
          getAssociatedTokenAddressSync(
            collectionMintKeypair.publicKey,
            wallet.publicKey,
            true,
            TOKEN_2022_PROGRAM_ID
          ),
          wallet.publicKey,
          1,
          0,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      const { builder: builderAuthorities, authoritiesGroup } =
        builders.createAuthoritiesGroup({
          provider,
          updateAuthority: wallet.publicKey,
          metadataAuthority: wallet.publicKey,
          inclusionAuthority: wallet.publicKey,
        });
      tx.add(await builderAuthorities.transaction());
      const { metadata, builder: metadataBuilder } = builders.createMetadata({
        provider,
        mintAuthority: wallet.publicKey,
        authoritiesGroup,
        name,
        contentHash: Array(32).fill(0),
        data: createExternalMetadataData(
          `https://solarsaloon.com/api/metadata/saloon/${collectionMintKeypair.publicKey.toString()}`
        ),
        mint: collectionMintKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      });
      tx.add(await metadataBuilder.transaction());

      tx.add(
        await rentBuilders
          .createCollection({
            provider,
            taxRate: new BN(Math.round(taxRate)),
            taxMint: taxToken.publicKey,
            minPrice: new BN(0),
            collectionMint: collectionMintKeypair.publicKey,
            authoritiesGroup,
          })
          .builder.transaction()
      );

      tx.sign(collectionMintKeypair);
      const conf = await wallet.sendTransaction(tx, connection, {
        skipPreflight: true,
      });

      // TODO: Let server handle tx exchange
      await fetch("/api/create/saloon", {
        method: "POST",
        body: JSON.stringify({
          collectionMint: collectionMintKeypair.publicKey,
          authoritiesGroup,
          taxMint: taxToken.publicKey.toString(),
          postCooldown,
        }),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetch("/api/create/metadata", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mint: collectionMintKeypair.publicKey.toString(),
          saloon: {
            name,
            description,
            symbol: "SOLSAL",
            image: "https://madlads.s3.us-west-2.amazonaws.com/images/9967.png",
            external_url: "https://solarsaloon.com",
            seller_fee_basis_points: 0,
            attributes: [
              {
                trait_type: "Creator",
                value: wallet?.publicKey.toString(),
              },
            ],
            properties: {
              files: [
                {
                  id: "portrait",
                  uri: "https://madlads.s3.us-west-2.amazonaws.com/images/9967.png",
                  type: "image/png",
                },
              ],
              category: "image",
              collection: {
                name: "Solar Saloons",
                family: "SOLSAL",
              },
              creators: [
                {
                  address: wallet?.publicKey.toString(),
                  share: 100,
                },
              ],
            },
          },
        }),
      });

      await connection.confirmTransaction(conf);

      router.push(`/saloon/${collectionMintKeypair.publicKey.toString()}`);
    } catch (err) {
      console.log(err);
      toast.error(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [
    provider,
    wallet,
    name,
    connection,
    router,
    taxRate,
    taxToken,
    token,
    postCooldown,
    description,
  ]);

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
            <Flex align="center" gap="2" direction="column">
              <Heading>Create a saloon</Heading>
              <Flex direction="column" width="100%">
                <Text color="gray">Saloon&apos;s name</Text>
                <TextFieldInput
                  placeholder="My Cool Saloon"
                  onChange={(e) => setName(e.target.value)}
                />
              </Flex>
              <Flex direction="column" width="100%">
                <Text color="gray">Saloon&apos;s description</Text>
                <TextArea
                  placeholder="A short description of what happens in this saloon..."
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Flex>
              <Flex direction="column" width="100%">
                <Text color="gray">Tax token</Text>
                <Select.Root
                  defaultValue={taxToken.name}
                  onValueChange={(tokenName) =>
                    setTaxToken(tokens.find((e) => e.name === tokenName)!)
                  }
                >
                  <Select.Trigger placeholder="Select a tax token…" />
                  <Select.Content>
                    <Select.Group>
                      {tokens.map((token) => (
                        <Select.Item value={token.name} key={token.name}>
                          {token.name}
                        </Select.Item>
                      ))}
                    </Select.Group>
                  </Select.Content>
                </Select.Root>
              </Flex>
              <Flex direction="column" width="100%" wrap={"wrap"}>
                <Text color="gray">Tax rate</Text>
                <Slider
                  min={1}
                  max={Math.log10(1000000)}
                  step={0.01}
                  defaultValue={[taxRate]}
                  onValueChange={(e) => setTaxRate(10 ** e[0])}
                />
                <Text weight="light" size="2" color="gray">
                  Holders will pay {(taxRate / 100).toFixed(2)}% of their
                  selling price every year, {(taxRate / 5600).toFixed(2)}% every
                  week.
                  <br />
                  Speculators will be rinsed within{" "}
                  {(100 / (taxRate / 5600)).toFixed(2)} weeks.
                </Text>
              </Flex>
              <Flex direction="column" width="100%" wrap={"wrap"}>
                <Text color="gray">Post cooldown</Text>
                <Slider
                  min={3}
                  max={Math.log10(86400000 * 21)}
                  step={0.001}
                  defaultValue={[Math.log10(postCooldown)]}
                  onValueChange={(e) => setPostCooldown(Math.round(10 ** e[0]))}
                />
                <Text weight="light" size="2" color="gray">
                  Subscribers will have to wait at least {formattedTime} before
                  being able to post again.
                </Text>
              </Flex>
              <Button
                disabled={isLoading || !name || !wallet}
                onClick={() => handleCreate()}
              >
                Create
              </Button>
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
