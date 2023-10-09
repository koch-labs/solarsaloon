import {
  Button,
  Dialog,
  Flex,
  Text,
  TextArea,
  TextField,
  TextFieldInput,
} from "@radix-ui/themes";
import { tokens } from "../../utils/tokens";
import { useCallback, useMemo, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { builders as rentBuilders } from "@koch-labs/rent-nft";
import { AnchorProvider, BN, utils } from "@coral-xyz/anchor";
import { Saloon } from "../../models/types";
import { Fetchable } from "../../models/types";
import WaitingButton from "../../components/WaitingButton";
import { Keypair } from "@solana/web3.js";
import { BASE_URL } from "../../utils/constants";
import toast from "react-hot-toast";
import { useCurrentUser } from "../../contexts/UserContextProvider";

export default function CreateSubscriptionModal({
  setOpen,
  open,
  saloon,
  reloadSubscriptions,
}: {
  setOpen: (boolean) => void;
  open: boolean;
  saloon: Saloon;
  reloadSubscriptions: () => void;
}) {
  const token = tokens.find((e) => e.publicKey.toString() === saloon?.taxMint);
  const { token: userToken } = useCurrentUser();
  const { connection } = useConnection();
  const wallet = useWallet();
  const provider = useMemo(
    () =>
      wallet ? new AnchorProvider(connection, wallet as any, {}) : undefined,
    [wallet, connection]
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isWaiting, setIsWaiting] = useState<boolean>(false);

  const handleCreate = useCallback(async () => {
    if (!provider || !wallet.signAllTransactions || !wallet.publicKey) return;

    setIsWaiting(true);
    try {
      const tokenMintKeypair = Keypair.generate();
      const tx = new Transaction();
      const {
        value: { blockhash, lastValidBlockHeight },
        context: { slot },
      } = await connection.getLatestBlockhashAndContext();
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = wallet.publicKey;
      tx.minNonceContextSlot = slot;

      const content = {
        name,
        external_uri: "",
      };
      const collectionMint = new PublicKey(saloon.collectionMint);
      tx.add(
        await rentBuilders
          .createToken({
            provider,
            uri: BASE_URL + `/metadata/${tokenMintKeypair.publicKey}`,
            contentHash: [
              ...utils.bytes.utf8
                .encode(utils.sha256.hash(JSON.stringify(content)))
                .values(),
            ],
            name,
            collectionMint,
            tokenMint: tokenMintKeypair.publicKey,
            authoritiesGroup: new PublicKey(saloon?.authoritiesGroup),
          })
          .builder.transaction()
      );
      tx.add(
        await rentBuilders
          .createBid({
            provider,
            collectionMint,
            authoritiesGroup: new PublicKey(saloon.authoritiesGroup),
            tokenMint: tokenMintKeypair.publicKey,
          })
          .builder.transaction()
      );
      tx.add(
        await rentBuilders
          .claimToken({
            provider,
            newSellPrice: new BN(0),
            oldOwner: wallet.publicKey,
            newOwner: wallet.publicKey,
            collectionMint: new PublicKey(saloon.collectionMint),
            tokenMint: tokenMintKeypair.publicKey,
          })
          .builder.transaction()
      );

      tx.sign(tokenMintKeypair);
      const signedTx = await wallet.signTransaction(tx);
      const conf = await connection.sendRawTransaction(signedTx.serialize());

      await fetch("/api/create/subscription", {
        method: "POST",
        body: JSON.stringify({
          saloon: saloon,
          tokenMint: tokenMintKeypair.publicKey,
        }),
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      await fetch("/api/create/metadata", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          mint: tokenMintKeypair.publicKey.toString(),
          subscription: {
            name,
            description,
            symbol: "SOLSALSUB",
            image: saloon?.metadata?.image,
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
                  uri: saloon?.metadata?.image,
                  type: "image/png",
                },
              ],
              category: "image",
              collection: {
                name: "Solar Saloons Subscription",
                family: "SOLSALSUB",
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

      reloadSubscriptions();
      setOpen(false);
    } catch (err) {
      console.log(err);
      toast.error(String(err));
      reloadSubscriptions();
    } finally {
      setIsWaiting(false);
    }
  }, [
    reloadSubscriptions,
    saloon,
    userToken,
    provider,
    connection,
    wallet,
    name,
    description,
    setOpen,
  ]);

  return (
    <Dialog.Root open={open}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>create a subscription</Dialog.Title>
        <Dialog.Description size="2" mb="4"></Dialog.Description>
        <Flex direction="column" gap="1" className="text-sm">
          <Text>
            set a name that clearly indicates what the subscriber should expect
            from holding this subscription
          </Text>
        </Flex>
        <Flex direction="column" gap="3">
          <label>
            <Flex justify="between" align="center">
              <Text as="div" size="2" mb="1" weight="bold">
                subscription&apos;s name
              </Text>
            </Flex>
            <TextFieldInput
              placeholder="Enter the subscription name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            <Flex justify="between" align="center">
              <Text as="div" size="2" mb="1" weight="bold">
                subscription&apos;s description
              </Text>
            </Flex>
            <TextArea
              placeholder="Enter the subscription description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button
              variant="soft"
              color="gray"
              onClick={() => {
                setOpen(false);
                setIsWaiting(false);
              }}
            >
              cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <WaitingButton
              onClick={handleCreate}
              disabled={!name}
              loading={isWaiting}
            >
              create
            </WaitingButton>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
