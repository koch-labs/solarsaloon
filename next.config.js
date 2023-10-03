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
  images: {
    domains: [
      "madlads.s3.us-west-2.amazonaws.com",
      "images.unsplash.com",
    ]
  }
}

module.exports = removeImports( nextConfig )