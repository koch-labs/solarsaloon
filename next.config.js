const removeImports = require( 'next-remove-imports' )( {
  test: /node_modules([\s\S]*?)\.(tsx|ts|js|mjs|jsx)$/,
  matchImports: "\\.(less|css|scss|sass|styl)$"
} );

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [ "@uiw/react-markdown-preview", "react-markdown" ],
  experimental: {
    esmExternals: "loose",
  },
}

module.exports = removeImports( nextConfig )