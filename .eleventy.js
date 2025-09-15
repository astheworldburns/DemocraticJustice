// .eleventy.js
const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // ## COLLECTIONS ##
  eleventyConfig.addCollection("sortedProofs", function(collectionApi) {
    let proofs;
    try {
      // Load proofs data directly for reliability
      proofs = require("./_data/proofs.json");
    } catch (error) {
      console.warn("Warning: `proofs.json` could not be loaded.", error);
      proofs = [];
    }

    if (!Array.isArray(proofs)) {
      console.warn("Warning: `proofs.json` data not found or is not an array.");
      return [];
    }

    // Sort by date in descending order
    return [...proofs].sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  // ## FILTERS ##
  eleventyConfig.addFilter("date", (dateObj, format = "LLLL d, yyyy") => {
    if (!dateObj) return "";
    return DateTime.fromJSDate(new Date(dateObj), { zone: 'utc' }).toFormat(format);
  });

  eleventyConfig.addFilter("truncate", (str, length = 150) => {
    if (!str) return "";
    if (str.length <= length) return str;
    const idx = str.lastIndexOf(" ", length);
    return str.slice(0, idx > 0 ? idx : length) + "…";
  });

  // ## PASSTHROUGH COPIES ##
  eleventyConfig.addPassthroughCopy("style.css");
  eleventyConfig.addPassthroughCopy("bundle.js");
  eleventyConfig.addPassthroughCopy("ga-consent.js");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy({ "_data/proofs.json": "data/proofs.json" });
  eleventyConfig.addPassthroughCopy("files");
  eleventyConfig.addPassthroughCopy("_redirects");

  // ## WATCH TARGETS ##
  eleventyConfig.addWatchTarget("./style.css");
  eleventyConfig.addWatchTarget("./bundle.js");
  eleventyConfig.addWatchTarget("./ga-consent.js");

  // ## GLOBALS ##
  // Expose environment variables to templates so deployment-specific
  // credentials (e.g. analytics tokens) can be referenced safely.
  eleventyConfig.addNunjucksGlobal("env", process.env);

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