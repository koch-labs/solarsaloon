import React from "react";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Button, Flex } from "@radix-ui/themes";
import { ButtonProps } from "@radix-ui/themes/dist/cjs/components/button";

export default function WaitingButton({
  children,
  loading = true,
  ...props
}: {
  children: React.ReactNode;
  loading: boolean;
} & ButtonProps &
  React.RefAttributes<HTMLButtonElement>) {
  return (
    <Button {...props} disabled={props.disabled || loading}>
      <Flex gap="2" align="center">
        {loading ? <ReloadIcon className="animate-spin" /> : null}
        {children}
      </Flex>
    </Button>
  );
}
