module.exports = {
  banner: true,
  input: {
    index: "src/index.js"
  },
  output: {
    extractCSS: false,
  },
  plugins: {
    vue: {
      css: true
    }
  }
};
