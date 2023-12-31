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
import { useCurrentUser } from "../../contexts/UserContextProvider";
import WaitingButton from "../../components/WaitingButton";
import { formatTime } from "../../utils";
import TagsPicker from "../../components/TagsPicker";
import useFees from "../../hooks/useFees";
import numeral from "numeral";

const CreateSaloon: React.FC = () => {
  const router = useRouter();
  const wallet = useWallet();
  const { isSignedIn, token, user } = useCurrentUser();
  const { connection } = useConnection();
  const provider = useMemo(
    () =>
      wallet ? new AnchorProvider(connection, wallet as any, {}) : undefined,
    [wallet, connection]
  );

  const [name, setName] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [image, setImage] = useState<string>();
  const [taxToken, setTaxToken] = useState<Token>(tokens[0]);
  const [taxRate, setTaxRate] = useState<number>(Math.log10(100000));
  const [postCooldown, setPostCooldown] = useState<number>(86400000);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { taxesPerYear } = useFees({
    price: 10,
    taxRate,
    lastUpdate: Date.now(),
    depositAmount: 10,
  });

  const formattedTime = formatTime(postCooldown);

  const handleCreate = useCallback(async () => {
    if (
      !provider ||
      !wallet.sendTransaction ||
      !wallet.publicKey ||
      !name ||
      !isSignedIn
    )
      return;

    setIsLoading(true);
    try {
      const collectionMintKeypair = Keypair.generate();
      const { blockhash } = await connection.getLatestBlockhash();

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
          tags,
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
            // image: "https://madlads.s3.us-west-2.amazonaws.com/images/9967.png",
            image,
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
                  uri: image,
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
    image,
    isSignedIn,
    tags,
  ]);

  return (
    <Container className="content-center">
      <Flex gap="2" direction="column">
        <Flex align="center" justify="center">
          <Card>
            <Flex position="absolute" gap="2">
              <Link href="/saloons">
                <IconButton variant="ghost">
                  <ArrowLeftIcon width={32} height={32} strokeWidth={5} />
                </IconButton>
              </Link>
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
                    <Text size="5">what are Saloons ?</Text>
                    <Text size="2">
                      saloons are digital spaces that only subscribers can
                      access.
                      <br />
                      the number of of available subscriptions can be increased
                      at any time, but only a subscriber can burn a subscription
                      so be carefull before minting too many.
                    </Text>
                    <Popover.Close>
                      <Button size="1">OK</Button>
                    </Popover.Close>
                  </Flex>
                </Popover.Content>
              </Popover.Root>
            </Flex>
            <Flex align="center" gap="2" direction="column">
              <Heading>create a saloon</Heading>
              <Flex direction="column" width="100%">
                <Text color="gray">saloon&apos;s name</Text>
                <TextFieldInput
                  placeholder="My Cool Saloon"
                  onChange={(e) => setName(e.target.value)}
                />
              </Flex>
              <Flex direction="column" width="100%">
                <Text color="gray">saloon&apos;s description</Text>
                <TextArea
                  placeholder="A short description of what happens in this saloon..."
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Flex>
              <Flex direction="column" width="100%">
                <Text color="gray">saloon&apos;s image</Text>
                <TextFieldInput
                  placeholder="URI to your image"
                  onChange={(e) => setImage(e.target.value)}
                />
              </Flex>
              <Flex direction="column" width="100%">
                <Text color="gray">saloon&apos;s tags</Text>
                <TagsPicker edit tags={tags} setTags={setTags} />
              </Flex>
              <Flex direction="column" width="100%">
                <Text color="gray">tax token</Text>
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
                <Text color="gray">tax rate</Text>
                <Slider
                  min={1}
                  max={Math.log10(5600 * 1000)}
                  step={0.01}
                  defaultValue={[taxRate]}
                  onValueChange={(e) => setTaxRate(10 ** e[0])}
                />
                <Text weight="light" size="2" color="gray">
                  holders will pay {(taxRate / 100).toFixed(2)}% of their
                  selling price every year, {(taxRate / 5600).toFixed(2)}% every
                  week.
                  <br />
                  example: someone buys your subscription and sets a price of 10
                  ${taxToken.symbol} will pay{" "}
                  {numeral(taxesPerYear / 365).format("0.000")}$
                  {taxToken.symbol} every day
                </Text>
              </Flex>
              <Flex direction="column" width="100%" wrap={"wrap"}>
                <Text color="gray">post cooldown</Text>
                <Slider
                  min={3}
                  max={Math.log10(86400000 * 365)}
                  step={0.001}
                  defaultValue={[Math.log10(postCooldown)]}
                  onValueChange={(e) => setPostCooldown(Math.round(10 ** e[0]))}
                />
                <Text weight="light" size="2" color="gray">
                  subscribers will have to wait at least {formattedTime} before
                  being able to post again.
                </Text>
              </Flex>
              <WaitingButton
                disabled={isLoading || !name || !wallet || !user}
                loading={isLoading}
                onClick={handleCreate}
              >
                create
              </WaitingButton>
            </Flex>
          </Card>
        </Flex>
      </Flex>
    </Container>
  );
};

export default CreateSaloon;
