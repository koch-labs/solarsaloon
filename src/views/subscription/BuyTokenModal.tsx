import {
  Box,
  Button,
  Dialog,
  Flex,
  Slider,
  Table,
  Tabs,
  Text,
  TextField,
} from "@radix-ui/themes";
import { tokens } from "../../utils/tokens";
import numeral from "numeral";
import { useCallback, useMemo, useState } from "react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getConfigKey, builders as rentBuilders } from "@koch-labs/rent-nft";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { FullSubscription } from "../../models/types";
import { Fetchable } from "../../models/types";
import {
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import WaitingButton from "../../components/WaitingButton";
import { formatTime } from "../../utils";
import useFees from "../../hooks/useFees";

export default function BuyTokenModal({
  setOpen,
  open,
  subscription,
}: {
  setOpen: (boolean) => void;
  open: boolean;
  subscription: Fetchable<FullSubscription>;
}) {
  const token = tokens.find(
    (e) => e.publicKey.toString() === subscription?.data?.saloon?.taxMint
  );
  const { connection } = useConnection();
  const user = useCurrentUser();
  const wallet = useWallet();
  const provider = useMemo(
    () =>
      wallet ? new AnchorProvider(connection, wallet as any, {}) : undefined,
    [wallet, connection]
  );
  const [isWaiting, setIsWaiting] = useState(false);
  const [newPrice, setNewPrice] = useState(0);
  const [prepaidDuration, setPrepaidDuration] = useState(Math.log10(3600));
  const { amount: amountLeft, timeLeft } = useFees({
    price: Number(
      numeral(subscription?.data?.ownerBidState?.sellingPrice)
        .divide(10 ** (token?.decimals || 0))
        .format("0.00000000000")
    ),
    taxRate: Number(subscription?.data?.saloon?.config?.taxRate),
    lastUpdate: Number(subscription?.data?.ownerBidState?.lastUpdate),
    depositAmount: Number(
      numeral(subscription?.data?.ownerBidState?.amount)
        .divide(10 ** (token?.decimals || 0))
        .format("0.00000000000")
    ),
  });
  const { taxesPerYear } = useFees({
    price: newPrice,
    taxRate: Number(subscription?.data?.saloon?.config?.taxRate),
    lastUpdate: Date.now(),
    depositAmount: 0,
  });
  const currentPrice = useMemo(
    () =>
      amountLeft === 0
        ? new BN(subscription?.data?.saloon?.config?.minimumSellPrice || 0)
        : new BN(subscription?.data?.ownerBidState?.sellingPrice || 0),
    [subscription?.data, amountLeft]
  );

  const handleBuy = useCallback(async () => {
    setIsWaiting(true);

    try {
      const tx = new Transaction();
      const {
        value: { blockhash, lastValidBlockHeight },
        context: { slot },
      } = await connection.getLatestBlockhashAndContext();
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = wallet.publicKey;
      tx.minNonceContextSlot = slot;

      const taxMint = new PublicKey(subscription?.data.saloon.taxMint);
      const collectionMint = new PublicKey(
        subscription?.data.saloon.collectionMint
      );
      const tokenMint = new PublicKey(subscription?.data.tokenState.tokenMint);
      const amount = currentPrice.add(
        new BN(taxesPerYear * 10 ** (token?.decimals || 0))
          .mul(new BN(Math.round(prepaidDuration)))
          .div(new BN(365 * 86400))
      );

      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          wallet.publicKey,
          getAssociatedTokenAddressSync(
            tokenMint,
            wallet.publicKey,
            true,
            TOKEN_2022_PROGRAM_ID
          ),
          wallet.publicKey,
          tokenMint,
          TOKEN_2022_PROGRAM_ID
        )
      );

      if (!subscription?.data.bidState) {
        tx.add(
          await rentBuilders
            .createBid({
              provider,
              collectionMint,
              authoritiesGroup: new PublicKey(
                subscription?.data.saloon.authoritiesGroup
              ),
              tokenMint,
            })
            .builder.transaction()
        );
      }

      tx.add(
        await rentBuilders
          .updateBid({
            provider,
            collectionMint,
            tokenMint,
          })
          .builder.transaction()
      );

      // Deposit the initial amount
      // Wrap the needed SOL
      if (token.publicKey === tokens[0].publicKey) {
        const wrappedSolAccount = getAssociatedTokenAddressSync(
          token.publicKey,
          wallet.publicKey,
          true,
          token.tokenProgram
        );
        tx.add(
          createAssociatedTokenAccountIdempotentInstruction(
            wallet.publicKey,
            wrappedSolAccount,
            wallet.publicKey,
            token.publicKey,
            token.tokenProgram
          )
        );
        tx.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: wrappedSolAccount,
            lamports: amount.toNumber(),
          })
        );
        tx.add(createSyncNativeInstruction(wrappedSolAccount));
      }

      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          wallet.publicKey,
          getAssociatedTokenAddressSync(
            token.publicKey,
            getConfigKey(
              new PublicKey(subscription?.data.saloon.collectionMint)
            ),
            true,
            token.tokenProgram
          ),
          getConfigKey(new PublicKey(subscription?.data.saloon.collectionMint)),
          token.publicKey,
          token.tokenProgram
        )
      );

      tx.add(
        await rentBuilders
          .increaseBid({
            provider,
            amount,
            taxMint,
            collectionMint,
            tokenMint,
            authoritiesGroup: new PublicKey(
              subscription?.data?.saloon?.authoritiesGroup
            ),
            tokenProgram: new PublicKey(token?.tokenProgram),
          })
          .builder.transaction()
      );

      if (!subscription?.data.ownerBidState) {
        // Token has no owner, claim it
        tx.add(
          await rentBuilders
            .claimToken({
              provider,
              newSellPrice: new BN(
                Math.round(newPrice * 10 ** (token?.decimals || 0))
              ),
              newOwner: wallet.publicKey,
              oldOwner: new PublicKey(
                subscription?.data?.subscription?.currentOwner.publicKey
              ),
              collectionMint,
              tokenMint: tokenMint,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .builder.transaction()
        );
      } else {
        // Buy token from current owner
        tx.add(
          await rentBuilders
            .updateBid({
              provider,
              bidder: new PublicKey(
                subscription?.data?.subscription.currentOwner.publicKey
              ),
              collectionMint,
              tokenMint,
            })
            .builder.transaction()
        );

        // Accounts with 0 selling price will never loose ownership on updates
        // They need to be bought, not claimed, but it's free
        if (
          amountLeft === 0 &&
          subscription?.data?.ownerBidState?.sellingPrice !== "0"
        ) {
          tx.add(
            await rentBuilders
              .claimToken({
                provider,
                newSellPrice: new BN(
                  Math.round(newPrice * 10 ** (token?.decimals || 0))
                ),
                newOwner: wallet.publicKey,
                oldOwner: new PublicKey(
                  subscription?.data?.subscription?.currentOwner.publicKey
                ),
                collectionMint,
                tokenMint: tokenMint,
                tokenProgram: TOKEN_2022_PROGRAM_ID,
              })
              .builder.transaction()
          );
        } else {
          tx.add(
            await rentBuilders
              .buyToken({
                provider,
                newSellPrice: new BN(
                  Math.round(newPrice * 10 ** (token?.decimals || 0))
                ),
                owner: new PublicKey(
                  subscription?.data.subscription?.currentOwner.publicKey
                ),
                collectionMint: new PublicKey(
                  subscription?.data.saloon.collectionMint
                ),
                tokenMint: new PublicKey(
                  subscription?.data.tokenState.tokenMint
                ),
                tokenProgram: TOKEN_2022_PROGRAM_ID,
              })
              .builder.transaction()
          );
        }
      }

      const conf = await wallet.sendTransaction(tx, connection, {
        skipPreflight: true,
      });
      await connection.confirmTransaction(conf);

      await fetch("/api/subscription/change", {
        method: "POST",
        body: JSON.stringify({
          tokenMint: subscription?.data.subscription?.tokenMint,
          currentPrice: newPrice,
          expirationDate: new Date(Date.now() + timeLeft).toUTCString(),
        }),
        headers: {
          authorization: `Bearer ${user.token}`,
        },
      });

      subscription?.reload();
      setOpen(false);
    } finally {
      setIsWaiting(false);
    }
  }, [
    connection,
    wallet,
    newPrice,
    prepaidDuration,
    provider,
    subscription,
    token,
    taxesPerYear,
    setOpen,
    user,
    currentPrice,
    timeLeft,
    amountLeft,
  ]);

  return (
    <Dialog.Root open={open}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>buy a subscription</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          pay{" "}
          {numeral(currentPrice.toString() || 0)
            .divide(10 ** (token?.decimals || 0))
            .format("0.000a")}{" "}
          ${token?.symbol || "???"} upfront, to acquire the subscription from
          the current owner
        </Dialog.Description>
        <Flex direction="column" gap="3">
          <Flex direction="column">
            <Text as="div" size="2" mb="1" weight="bold">
              new selling price
            </Text>
            <TextField.Input
              placeholder="Enter the new sell price..."
              onChange={(e) => setNewPrice(Number(e.target.value))}
            />
            <Text size="1" color="gray">
              you will pay {numeral(taxesPerYear / 365).format("0.000a")} $
              {token?.symbol} every day you own the subscription.
            </Text>
          </Flex>
          <Flex direction="column">
            <Text as="div" size="2" mb="1" weight="bold">
              prepaid duration
            </Text>
            <Slider
              defaultValue={[1]}
              step={0.1}
              min={0.1}
              max={Math.log10(365 * 86400)}
              onValueChange={(e) => setPrepaidDuration(10 ** Number(e[0]))}
            />
            <Text size="1" color="gray" mt="1">
              pre-pay for {formatTime(prepaidDuration * 1000)}
            </Text>
            <Text size="1" color="gray">
              you will deposit{" "}
              {numeral(
                (taxesPerYear * Math.round(prepaidDuration)) / (365 * 86400)
              ).format("0.000a")}{" "}
              ${token?.symbol}, but can withdraw the remaining at anytime
            </Text>
          </Flex>
          <Text>
            you have {numeral(subscription?.data?.userBalance).format("0.000a")}{" "}
            ${token?.symbol}
          </Text>
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
                loading={isWaiting}
                onClick={handleBuy}
                disabled={
                  newPrice === 0 ||
                  subscription?.data?.userBalance <
                    Number(
                      numeral(
                        (taxesPerYear * Math.round(prepaidDuration)) /
                          (365 * 86400)
                      )
                        .divide(10 ** (token?.decimals || 0))
                        .format("0.000")
                    )
                }
              >
                buy
              </WaitingButton>
            </Dialog.Close>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
