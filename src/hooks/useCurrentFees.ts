import { BN } from "@coral-xyz/anchor";
import { Token } from "../utils/tokens";
import { useEffect, useState } from "react";
import numeral from "numeral";
import { useWallet } from "@solana/wallet-adapter-react";
import { FullSubscription } from "../models/types";
import { BidStateJSON } from "@koch-labs/rent-nft";

export default function useCurrentFees({
  token,
  subscription,
  bidState,
  increasing,
}: {
  token?: Token;
  subscription?: FullSubscription;
  bidState?: BidStateJSON;
  increasing?: boolean;
}) {
  const wallet = useWallet();
  const taxesPerYear = new BN(
    subscription?.tokenState?.currentSellingPrice || 0
  )
    .mul(new BN(subscription?.saloon?.config?.taxRate || 0))
    .div(new BN(10000));
  const timeLeft: number = !taxesPerYear.eq(new BN(0))
    ? Math.max(
        0,
        Number(bidState?.lastUpdate) * 1000 +
          Number(
            numeral(
              new BN(bidState?.amount).mul(new BN(31536000000)).toString()
            )
              .divide(taxesPerYear.toString())
              .format("0.0")
          ) -
          Date.now()
      )
    : 0;
  const [amount, setAmount] = useState<string>(
    numeral(bidState?.amount || "0").format("0.000a")
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (!bidState) {
        setAmount(numeral("0").format("0.000a"));
        return;
      } else if (bidState?.bidder !== wallet?.publicKey?.toString()) {
        setAmount(
          numeral(bidState?.amount)
            .divide(10 ** (token?.decimals || 0))
            .format("0.000a")
        );
        return;
      }

      if (increasing) {
        setAmount(
          numeral(
            new BN(subscription?.saloon?.config?.collectedTax || 0)
              .add(
                taxesPerYear
                  .mul(
                    new BN(
                      Math.round(
                        Date.now() / 1000 - Number(bidState?.lastUpdate || 0)
                      )
                    )
                  )
                  .div(new BN(31536000))
              )
              .toString()
          )
            .divide(10 ** (token?.decimals || 0))
            .format("0.000a")
        );
      } else {
        setAmount(() => {
          const num = numeral(
            new BN(bidState?.amount || 0)
              .sub(
                taxesPerYear
                  .mul(
                    new BN(
                      Math.round(
                        Date.now() / 1000 - Number(bidState?.lastUpdate || 0)
                      )
                    )
                  )
                  .div(new BN(31536000))
              )
              .toString()
          )
            .divide(10 ** (token?.decimals || 0))
            .format("0.000a");

          // Floor to 0
          if (num.includes("-")) {
            return "0.000";
          }

          return num;
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [
    token,
    bidState,
    subscription,
    taxesPerYear,
    increasing,
    wallet.publicKey,
  ]);

  return { amount, taxesPerYear, timeLeft };
}
