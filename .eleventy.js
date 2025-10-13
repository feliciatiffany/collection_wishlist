module.exports = function(eleventyConfig) {

  eleventyConfig.addPassthroughCopy("styles");
  eleventyConfig.addPassthroughCopy("scripts");
  eleventyConfig.addPassthroughCopy("images");
  return {
    dir: {
      input: ".",     // your source files
      output: "docs"  // GitHub Pages will serve from this
    }
  };
};