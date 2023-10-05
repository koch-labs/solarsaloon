import AccountNav from "./AccountNav";
import React from "react";
import { Flex, Heading } from "@radix-ui/themes";
import Link from "next/link";
import Image from "next/image";
import logo from "../../assets/ss_logo_black.png";

const Header: React.FC = () => {
  return (
    <header className="pz-4">
      <div className="flex h-16 items-center justify-between py-4 px-2 md:px-8">
        <Link className="items-center space-x-2" href="/">
          <Flex gap="2" align="center">
            <Image src={logo} width={32} alt="SolarSaloon logo" />
            <Heading>solar.saloon</Heading>
          </Flex>
        </Link>
        <AccountNav />
      </div>
    </header>
  );
};

export default Header;
