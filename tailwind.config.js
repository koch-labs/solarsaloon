module.exports = {
  mode: "jit",
  content: [ "./src/**/*.{js,jsx,ts,tsx}" ],
  darkMode: "media",
  plugins: [
    require( "@tailwindcss/typography" )
  ],
  theme: {
    colors: {
      'brand-gray': "#F5F5F5",
      'brand-gray-2': "#E6E6E6"
    }
  }
}