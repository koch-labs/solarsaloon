import AccountNav from "./AccountNav";
import React from "react";
import { Heading } from "@radix-ui/themes";
import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white pz-4">
      <div className="flex h-16 items-center justify-between py-4 px-2 md:px-8">
        <Link className="items-center space-x-2" href="/">
          <Heading>solar.saloon</Heading>
        </Link>
        <AccountNav />
      </div>
    </header>
  );
};

export default Header;
