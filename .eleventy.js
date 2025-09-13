// .eleventy.js
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // ## COLLECTIONS ##
  eleventyConfig.addCollection("sortedProofs", function(collectionApi) {
    const proofs = collectionApi.getAll()[0].data.proofs;
    if (!proofs || !Array.isArray(proofs)) {
      console.warn("Warning: `proofs.json` data not found or is not an array.");
      return [];
    }
    return proofs.sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  // ## FILTERS ##
  eleventyConfig.addFilter("date", (dateObj, format = "LLLL d, yyyy") => {
    if (!dateObj) return "";
    return DateTime.fromJSDate(new Date(dateObj), { zone: 'utc' }).toFormat(format);
  });

  eleventyConfig.addFilter("truncate", (str, length = 150) => {
    if (!str) return "";
    if (str.length <= length) return str;
    return str.substr(0, length) + "...";
  });

  // ## PASSTHROUGH COPIES ##
  eleventyConfig.addPassthroughCopy("style.css");
  eleventyConfig.addPassthroughCopy("script.js");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy({ "_data/proofs.json": "data/proofs.json" });
  eleventyConfig.addPassthroughCopy("files");

  // ## WATCH TARGETS ##
  eleventyConfig.addWatchTarget("./style.css");
  eleventyConfig.addWatchTarget("./script.js");

  // ## SERVER OPTIONS ##
  eleventyConfig.setServerOptions({
    showAllFiles: true
  });

  // ## DIRECTORY CONFIG ##
  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};