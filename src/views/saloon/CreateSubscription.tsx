import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Callout, Text, Heading } from "@radix-ui/themes";
import React, { useCallback, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN, utils } from "@coral-xyz/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import { BASE_URL } from "../../utils/constants";
import { Fetchable, Saloon } from "../../models/types";
import { builders as rentBuilders } from "@koch-labs/rent-nft";
import WaitingButton from "../../components/WaitingButton";

const CreateSubscription: React.FC<{
  saloon: Fetchable<Saloon>;
}> = ({ saloon }) => {
  const router = useRouter();
  const wallet = useWallet();
  const { token } = useCurrentUser();
  const { connection } = useConnection();
  const provider = useMemo(
    () =>
      wallet ? new AnchorProvider(connection, wallet as any, {}) : undefined,
    [wallet, connection]
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSubscription = useCallback(async () => {
    console.log(provider, wallet, saloon);
    if (!provider || !wallet.signAllTransactions || !wallet.publicKey) return;

    setIsLoading(true);
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

      const name = "Subscription";
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
            authoritiesGroup: new PublicKey(saloon.authoritiesGroup),
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
        body: JSON.stringify({ saloon, tokenMint: tokenMintKeypair.publicKey }),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await connection.confirmTransaction(conf);

      saloon.reload();
    } catch (err) {
      console.log(err);
      toast.error(String(err));
      saloon.reload();
    } finally {
      setIsLoading(false);
    }
  }, [saloon, token, provider, connection, wallet]);

  return (
    <Flex gap="2" direction="column" align="center" p="5">
      <Heading size="5">Create a subscription</Heading>
      <WaitingButton
        style={{ backgroundColor: "black" }}
        loading={isLoading}
        onClick={handleCreateSubscription}
      >
        <Text className="p-3">Create a new subscription</Text>
      </WaitingButton>
      <Flex align="center" gap="2">
        <InfoCircledIcon />
        <Text className="underline">
          Subscriptions can only be created, not destroyed so be careful when
          creating more.
        </Text>
      </Flex>
    </Flex>
  );
};

export default CreateSubscription;
