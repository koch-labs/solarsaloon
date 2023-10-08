import Header from "./Header";
import React, { ReactNode } from "react";

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="mx-auto min-h-screen h-fit bg-brand-gray">
      <Header />
      <div id="content" className="w-100 h-fit">
        {children}
      </div>
    </div>
  );
};

export default Layout;
