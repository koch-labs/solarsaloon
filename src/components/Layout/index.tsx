import Header from "./Header";
import React, { ReactNode } from "react";

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="mx-auto flex flex-col h-screen overflow-hidden">
      <Header />
      <div id="content" className="w-100 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;
