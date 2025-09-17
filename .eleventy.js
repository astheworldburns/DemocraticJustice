// .eleventy.js
const { DateTime } = require("luxon");
const Image = require("@11ty/eleventy-img");
const fs = require("node:fs/promises");
const path = require("node:path");

function normalizeProofsData(raw) {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw;
  }

  if (typeof raw === "object") {
    const preferredKeys = [
      "proofs",
      "items",
      "data",
      "results",
      "entries",
      "records",
      "default"
    ];

    for (const key of preferredKeys) {
      const value = raw[key];
      if (Array.isArray(value)) {
        return value;
      }
      if (value && typeof value === "object") {
        const nested = normalizeProofsData(value);
        if (nested.length) {
          return nested;
        }
      }
    }

    for (const value of Object.values(raw)) {
      if (Array.isArray(value)) {
        return value;
      }
      if (value && typeof value === "object") {
        const nested = normalizeProofsData(value);
        if (nested.length) {
          return nested;
        }
      }
    }
  }

  return [];
}

async function generateSharePNGs() {
  const shareOutputDir = path.join("_site", "share");

  let entries;
  try {
    entries = await fs.readdir(shareOutputDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }
    throw error;
  }

  const svgFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".svg"));

  for (const svgFile of svgFiles) {
    const sourcePath = path.join(shareOutputDir, svgFile.name);
    await Image(sourcePath, {
      formats: ["png"],
      widths: [null],
      outputDir: shareOutputDir,
      filenameFormat: function (id, src, width, format) {
        const basename = path.basename(src, path.extname(src));
        return `${basename}.${format}`;
      }
    });
  }
}

module.exports = function(eleventyConfig) {
  // ## COLLECTIONS ##
  eleventyConfig.addCollection("sortedProofs", function(collectionApi) {
    let proofs;
    try {
      // Load proofs data directly for reliability
      const proofsPath = require.resolve("./_data/proofs.json");
      delete require.cache[proofsPath];
      proofs = require(proofsPath);
    } catch (error) {
      console.warn("Warning: `proofs.json` could not be loaded.", error);
      proofs = [];
    }

    const normalizedProofs = normalizeProofsData(proofs);

    if (!normalizedProofs.length) {
      console.warn("Warning: `proofs.json` data not found or is not an array.");
      return [];
    }

    // Sort by date in descending order
    return [...normalizedProofs].sort((a, b) => new Date(b.date) - new Date(a.date));
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

  eleventyConfig.on("afterBuild", async () => {
    await generateSharePNGs();
  });

  // ## DIRECTORY CONFIG ##
  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};