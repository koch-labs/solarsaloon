import React from "react";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Button, Flex } from "@radix-ui/themes";
import { ButtonProps } from "@radix-ui/themes/dist/cjs/components/button";
import Link from "next/link";

export default function NavigationPath({
  path,
}: {
  path: { href: string; name: string }[];
} & ButtonProps &
  React.RefAttributes<HTMLButtonElement>) {
  return (
    <Flex gap="1" className="px-2 md:px-8 py-4">
      {path.map(({ href, name }, i) => (
        <Link key={href} href={href}>
          {name} {i !== path.length - 1 ? " / " : ""}
        </Link>
      ))}
    </Flex>
  );
}
