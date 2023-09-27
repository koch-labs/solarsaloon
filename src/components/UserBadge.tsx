import { Badge, Flex, IconButton, Text } from "@radix-ui/themes";
import { PublicKey } from "@solana/web3.js";
import { shortKey } from "../utils";
import Link from "next/link";
import { EnterIcon, ExitIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import { getExplorerUrl } from "../utils/explorer";

export default function UserBadge({
  publicKey,
}: {
  publicKey: PublicKey | string;
}) {
  return (
    <Badge>
      <Flex align="center" gap="1" p="1">
        <Text>{shortKey(publicKey)}</Text>
        <Link href={`/user/${publicKey}`} target="_blank">
          <IconButton variant="ghost" size="1">
            <EnterIcon />
          </IconButton>
        </Link>
        <Link href={getExplorerUrl(publicKey)} target="_blank">
          <IconButton variant="ghost" size="1">
            <ExitIcon />
          </IconButton>
        </Link>
      </Flex>
    </Badge>
  );
}
