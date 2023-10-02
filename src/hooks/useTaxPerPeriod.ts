import { BN } from "@coral-xyz/anchor";
import { Token } from "../utils/tokens";
import { useEffect, useState } from "react";
import numeral from "numeral";
import { FullSubscription, Subscription } from "../models/types";

export default function useTaxPerPeriod({
  taxRate = 0,
  currentPrice = 0,
  collectedTax = 0,
  lastUpdate = 0,
}: {
  taxRate: string | number;
  currentPrice: string | number;
  collectedTax: string | number;
  lastUpdate: string | number;
}) {
  const taxesPerYear = new BN(currentPrice)
    .mul(new BN(taxRate))
    .div(new BN(10000));
  const [taxes, setTaxes] = useState<BN>(
    numeral(collectedTax || "0").format("0.00a")
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTaxes(
        new BN(collectedTax).add(
          taxesPerYear
            .mul(new BN(Math.round(Date.now() / 1000 - Number(lastUpdate))))
            .div(new BN(31536000))
        )
      );
    }, 500);

    return () => clearInterval(interval);
  }, [lastUpdate, taxRate, collectedTax, taxesPerYear]);

  return { taxes, taxesPerYear };
}
