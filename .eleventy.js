// .eleventy.js
const { DateTime } = require("luxon");
const Image = require("@11ty/eleventy-img");
const fs = require("node:fs/promises");
const path = require("node:path");
const htmlMinifier = require("html-minifier-terser");
const slugifyImport = require("@sindresorhus/slugify");
const slugifyFn = typeof slugifyImport === "function" ? slugifyImport : slugifyImport?.default;

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

function parseCaseIdSegments(caseId) {
  if (!caseId) {
    return [];
  }

  return String(caseId)
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map((segment) => Number.parseInt(segment, 10));
}

function compareCaseIds(a, b) {
  const segmentsA = parseCaseIdSegments(a);
  const segmentsB = parseCaseIdSegments(b);
  const length = Math.max(segmentsA.length, segmentsB.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (segmentsA[index] ?? 0) - (segmentsB[index] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return String(a ?? "").localeCompare(String(b ?? ""));
}

function compareProofsByCaseId(a = {}, b = {}) {
  const caseDiff = compareCaseIds(a.case_id, b.case_id);
  if (caseDiff !== 0) {
    return caseDiff;
  }

  const dateA = a.date ? new Date(a.date).getTime() : 0;
  const dateB = b.date ? new Date(b.date).getTime() : 0;

  if (dateA !== dateB) {
    return dateA - dateB;
  }

  return String(a.title ?? "").localeCompare(String(b.title ?? ""));
}

function parseReviewDate(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof DateTime.isDateTime === "function" && DateTime.isDateTime(value)) {
    return value.isValid ? value.setZone("utc") : null;
  }

  if (value instanceof Date) {
    const dateTime = DateTime.fromJSDate(value, { zone: "utc" });
    return dateTime.isValid ? dateTime : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const dateTime = DateTime.fromMillis(value, { zone: "utc" });
    return dateTime.isValid ? dateTime : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    let dateTime = DateTime.fromISO(trimmed, { zone: "utc" });
    if (dateTime.isValid) {
      return dateTime;
    }

    if (typeof DateTime.fromRFC2822 === "function") {
      dateTime = DateTime.fromRFC2822(trimmed, { zone: "utc" });
      if (dateTime.isValid) {
        return dateTime;
      }
    }

    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      dateTime = DateTime.fromMillis(parsed, { zone: "utc" });
      if (dateTime.isValid) {
        return dateTime;
      }
    }
  }

  return null;
}

function normalizeIntentList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => (entry === undefined || entry === null ? "" : String(entry)))
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  }

  return [String(value).trim().toLowerCase()].filter(Boolean);
}

function matchesIntent(data = {}, intent) {
  if (!intent) {
    return false;
  }

  const normalizedIntent = normalizeIntentList(data.intent ?? data.type);
  if (normalizedIntent.includes(intent)) {
    return true;
  }

  const normalizedTasks = normalizeIntentList(data.tasks);
  return normalizedTasks.includes(intent);
}

function sortByIntentMetadata(a = {}, b = {}) {
  const dataA = a.data ?? {};
  const dataB = b.data ?? {};

  const orderA = Number.isFinite(dataA.intentOrder) ? dataA.intentOrder : Number.POSITIVE_INFINITY;
  const orderB = Number.isFinite(dataB.intentOrder) ? dataB.intentOrder : Number.POSITIVE_INFINITY;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  const titleA = String(dataA.title ?? a.fileSlug ?? "").toLowerCase();
  const titleB = String(dataB.title ?? b.fileSlug ?? "").toLowerCase();

  if (titleA && titleB) {
    return titleA.localeCompare(titleB);
  }

  if (titleA) {
    return -1;
  }

  if (titleB) {
    return 1;
  }

  return 0;
}

function createIntentCollection(collectionApi, intent) {
  const normalizedIntent = typeof intent === "string" ? intent.trim().toLowerCase() : "";

  if (!normalizedIntent) {
    return [];
  }

  return collectionApi
    .getAll()
    .filter((item) => matchesIntent(item?.data, normalizedIntent))
    .sort(sortByIntentMetadata);
}

function slugifyValue(value) {
  if (value === undefined || value === null) {
    return "";
  }
  const input = String(value);
  if (typeof slugifyFn === "function") {
    return slugifyFn(input, { decamelize: false });
  }
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeOverproofEntry(entry = {}, index = 0) {
  const umbrella = entry.umbrella_category ?? entry.title ?? entry.slug ?? entry.id ?? `Overproof ${index + 1}`;

  const slugCandidates = [entry.slug, umbrella, entry.id, `overproof-${index + 1}`];
  let slug = "";
  for (const candidate of slugCandidates) {
    if (!candidate) {
      continue;
    }
    slug = slugifyValue(candidate);
    if (slug) {
      break;
    }
  }
  if (!slug) {
    slug = `overproof-${index + 1}`;
  }

  const id = entry.id ?? `overproof-${slug}`;
  const title = entry.title ?? umbrella ?? slug;
  const shortTitle = entry.short_title ?? title;
  const summary = entry.summary ?? entry.description ?? "";
  const narrative = entry.narrative ?? entry.body ?? "";
  const keyPoints = Array.isArray(entry.key_points) ? entry.key_points : [];
  const metadata = entry.metadata && typeof entry.metadata === "object" ? entry.metadata : {};
  const order = Number.isFinite(entry.order) ? entry.order : index + 1;

  const url = `/briefs/${slug}/`;

  return {
    ...entry,
    id,
    slug,
    title,
    short_title: shortTitle,
    umbrella_category: umbrella,
    summary,
    narrative,
    key_points: keyPoints,
    metadata,
    order,
    url
  };
}

function normalizeBriefEntry(entry = {}, index = 0) {
  const headline = entry.headline ?? entry.title ?? entry.name ?? `Brief ${index + 1}`;

  const slugCandidates = [entry.slug, entry.id, headline, `brief-${index + 1}`];
  let slug = "";
  for (const candidate of slugCandidates) {
    if (!candidate) {
      continue;
    }
    slug = slugifyValue(candidate);
    if (slug) {
      break;
    }
  }
  if (!slug) {
    slug = `brief-${index + 1}`;
  }

  const id = entry.id ?? `brief-${slug}`;
  const lede = entry.lede ?? entry.summary ?? entry.description ?? "";
  const url = `/briefs/${slug}/`;
  const violations = Array.isArray(entry.violations)
    ? entry.violations.map((violation) => {
        if (!violation || typeof violation !== "object") {
          return { title: String(violation ?? "") };
        }
        const proofLinks = Array.isArray(violation.proofs)
          ? violation.proofs.map((proof) => (proof && typeof proof === "object" ? { ...proof } : { title: String(proof ?? "") }))
          : [];
        const evidencePoints = Array.isArray(violation.evidencePoints) ? [...violation.evidencePoints] : [];
        return {
          ...violation,
          proofs: proofLinks,
          evidencePoints
        };
      })
    : [];
  const conclusion = entry.conclusion && typeof entry.conclusion === "object" ? { ...entry.conclusion } : null;
  const nextBrief = entry.nextBrief && typeof entry.nextBrief === "object"
    ? {
        ...entry.nextBrief,
        slug: entry.nextBrief.slug ? slugifyValue(entry.nextBrief.slug) : entry.nextBrief.slug ?? "",
        url: entry.nextBrief.slug ? `/briefs/${slugifyValue(entry.nextBrief.slug)}/` : entry.nextBrief.url ?? null
      }
    : null;

  return {
    ...entry,
    id,
    slug,
    url,
    headline,
    lede,
    violations,
    conclusion,
    nextBrief
  };
}

function assembleProofCollections() {
  let proofsData;
  try {
    const proofsPath = require.resolve("./_data/proofs.json");
    delete require.cache[proofsPath];
    proofsData = require(proofsPath);
  } catch (error) {
    console.warn("Warning: `proofs.json` could not be loaded.", error);
    proofsData = [];
  }

  const normalizedProofs = normalizeProofsData(proofsData);

  if (!normalizedProofs.length) {
    console.warn("Warning: `proofs.json` data not found or is not an array.");
    return {
      proofs: [],
      overproofGroups: [],
      overproofList: []
    };
  }

  let overproofsData;
  try {
    const overproofsPath = require.resolve("./_data/overproofs.json");
    delete require.cache[overproofsPath];
    overproofsData = require(overproofsPath);
  } catch (error) {
    console.warn("Warning: `overproofs.json` could not be loaded.", error);
    overproofsData = [];
  }

  const normalizedOverproofs = normalizeProofsData(overproofsData);
  let briefsData;
  try {
    const briefsPath = require.resolve("./_data/brief.json");
    delete require.cache[briefsPath];
    briefsData = require(briefsPath);
  } catch (error) {
    console.warn("Warning: `brief.json` could not be loaded.", error);
    briefsData = [];
  }

  const normalizedBriefs = normalizeProofsData(briefsData);
  const processedBriefs = normalizedBriefs.map((entry, index) => normalizeBriefEntry(entry, index));
  const briefBySlug = new Map();
  for (const brief of processedBriefs) {
    if (brief.slug) {
      briefBySlug.set(brief.slug, brief);
    }
  }

  const processedOverproofs = normalizedOverproofs.map((entry, index) => {
    const overproof = normalizeOverproofEntry(entry, index);

    const slugCandidates = [entry.brief_slug, entry.slug, overproof.slug, entry.umbrella_category];
    let matchedBrief = null;
    for (const candidate of slugCandidates) {
      if (!candidate) {
        continue;
      }
      const candidateSlug = slugifyValue(candidate);
      if (candidateSlug && briefBySlug.has(candidateSlug)) {
        matchedBrief = briefBySlug.get(candidateSlug);
        break;
      }
    }

    return {
      ...overproof,
      brief: matchedBrief ? { ...matchedBrief } : null
    };
  });

  const overproofById = new Map();
  const overproofByUmbrella = new Map();

  for (const overproof of processedOverproofs) {
    if (overproof.id) {
      overproofById.set(overproof.id, overproof);
    }
    if (overproof.umbrella_category) {
      overproofByUmbrella.set(overproof.umbrella_category, overproof);
    }
  }

  const sortedProofs = [...normalizedProofs].sort(compareProofsByCaseId);

  const enrichedProofs = sortedProofs.map((proof, index) => {
    const umbrella = proof.umbrella_category ?? "";
    let overproofMeta = null;

    if (proof.overproof_id && overproofById.has(proof.overproof_id)) {
      overproofMeta = overproofById.get(proof.overproof_id);
    } else if (umbrella && overproofByUmbrella.has(umbrella)) {
      overproofMeta = overproofByUmbrella.get(umbrella);
    } else if (umbrella) {
      const fallbackSlug = slugifyValue(umbrella) || `overproof-${index + 1}`;
      const fallbackId = `overproof-${fallbackSlug}`;
      overproofMeta = {
        id: fallbackId,
        slug: fallbackSlug,
        title: umbrella,
        short_title: umbrella,
        umbrella_category: umbrella,
        summary: "",
        narrative: "",
        key_points: [],
        metadata: {},
        order: processedOverproofs.length + index + 1,
        url: `/proofs/${fallbackSlug}/`
      };
      processedOverproofs.push(overproofMeta);
      overproofById.set(overproofMeta.id, overproofMeta);
      overproofByUmbrella.set(umbrella, overproofMeta);
      console.warn(`Warning: Created fallback overproof metadata for umbrella category "${umbrella}".`);
    } else {
      console.warn(`Warning: Proof ${proof.case_id ?? proof.slug ?? index} is missing umbrella category information for overproof lookup.`);
    }

    return {
      ...proof,
      overproof_id: overproofMeta?.id ?? proof.overproof_id ?? null,
      overproof: overproofMeta ? { ...overproofMeta } : null
    };
  });

  const proofCounts = new Map();
  for (const proof of enrichedProofs) {
    const overproofId = proof.overproof?.id;
    if (overproofId) {
      proofCounts.set(overproofId, (proofCounts.get(overproofId) ?? 0) + 1);
    }
  }

  const finalProofs = enrichedProofs.map((proof) => {
    if (!proof.overproof) {
      return proof;
    }
    const proofCount = proofCounts.get(proof.overproof.id) ?? 0;
    return {
      ...proof,
      overproof: {
        ...proof.overproof,
        proofCount
      }
    };
  });

  const groupsMap = new Map();
  for (const proof of finalProofs) {
    const overproof = proof.overproof;
    if (!overproof?.id) {
      continue;
    }
    let group = groupsMap.get(overproof.id);
    if (!group) {
      group = {
        overproof: { ...overproof },
        proofs: []
      };
      groupsMap.set(overproof.id, group);
    }
    group.proofs.push(proof);
  }

  const overproofGroups = Array.from(groupsMap.values())
    .map((group) => {
      const proofsForGroup = [...group.proofs].sort(compareProofsByCaseId);
      const overproof = {
        ...group.overproof,
        proofCount: proofsForGroup.length
      };
      return {
        overproof,
        proofs: proofsForGroup
      };
    })
    .sort((a, b) => {
      const orderDiff = (a.overproof.order ?? 0) - (b.overproof.order ?? 0);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return a.overproof.title.localeCompare(b.overproof.title);
    });

  const overproofList = processedOverproofs
    .map((overproof) => ({
      ...overproof,
      proofCount: proofCounts.get(overproof.id) ?? 0
    }))
    .sort((a, b) => {
      const orderDiff = (a.order ?? 0) - (b.order ?? 0);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return a.title.localeCompare(b.title);
    });

  return {
    proofs: finalProofs,
    overproofGroups,
    overproofList,
    briefs: processedBriefs
  };
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

let cachedProofCollections;
function getProofCollections() {
  if (!cachedProofCollections) {
    cachedProofCollections = assembleProofCollections();
  }
  return cachedProofCollections;
}

module.exports = function(eleventyConfig) {
  eleventyConfig.addCollection("sortedProofs", function() {
    const { proofs } = getProofCollections();
    return proofs;
  });

  eleventyConfig.addCollection("overproofs", function() {
    const { overproofGroups } = getProofCollections();
    return overproofGroups;
  });

  eleventyConfig.addCollection("needsReview", function(collectionApi) {
    const now = DateTime.utc().startOf("day");
    const reviewItems = [];
    const seen = new Set();

    function addReviewItem(entry) {
      if (!entry || !entry.id || seen.has(entry.id)) {
        return;
      }
      seen.add(entry.id);
      reviewItems.push(entry);
    }

    for (const item of collectionApi.getAll()) {
      const reviewDateTime = parseReviewDate(item?.data?.reviewDate);
      if (!reviewDateTime || reviewDateTime > now) {
        continue;
      }

      const reviewDateIso = reviewDateTime.toISODate();
      const title = item?.data?.title ?? item?.data?.page?.title ?? item?.fileSlug ?? item?.inputPath;

      addReviewItem({
        id: `content:${item.inputPath}`,
        type: "content",
        title,
        url: item.url ?? null,
        source: item.inputPath,
        reviewDate: reviewDateIso,
        reviewDateValue: reviewDateTime.toMillis()
      });
    }

    const { proofs = [], overproofList = [], briefs = [] } = getProofCollections();

    for (const proof of proofs) {
      const reviewDateTime = parseReviewDate(proof.reviewDate);
      if (!reviewDateTime || reviewDateTime > now) {
        continue;
      }

      const overproofSlug = proof.overproof?.slug ? slugifyValue(proof.overproof.slug) : "";
      const proofSlug = slugifyValue(proof.slug ?? proof.case_id ?? "");
      let url = null;
      if (overproofSlug && proofSlug) {
        url = `/proofs/${overproofSlug}/${proofSlug}/`;
      } else if (overproofSlug) {
        url = `/proofs/${overproofSlug}/`;
      }

      const reviewDateIso = reviewDateTime.toISODate();
      addReviewItem({
        id: `proof:${proof.case_id ?? proof.slug ?? proof.title ?? reviewDateIso}`,
        type: "proof",
        title: proof.title ?? (proof.case_id ? `Proof ${proof.case_id}` : "Proof"),
        url,
        source: "_data/proofs.json",
        caseId: proof.case_id ?? null,
        overproofTitle: proof.overproof?.title ?? null,
        reviewDate: reviewDateIso,
        reviewDateValue: reviewDateTime.toMillis()
      });
    }

    for (const overproof of overproofList) {
      const reviewDateTime = parseReviewDate(overproof.reviewDate);
      if (!reviewDateTime || reviewDateTime > now) {
        continue;
      }

      const overproofSlug = overproof.slug ? slugifyValue(overproof.slug) : "";
      const url = overproofSlug ? `/proofs/${overproofSlug}/` : null;
      addReviewItem({
        id: `overproof:${overproof.id ?? overproofSlug ?? overproof.title}`,
        type: "overproof",
        title: overproof.title ?? overproof.short_title ?? "Overproof",
        url,
        source: "_data/overproofs.json",
        reviewDate: reviewDateTime.toISODate(),
        reviewDateValue: reviewDateTime.toMillis()
      });
    }

    for (const brief of briefs) {
      const reviewDateTime = parseReviewDate(brief.reviewDate);
      if (!reviewDateTime || reviewDateTime > now) {
        continue;
      }

      const briefSlug = brief.slug ? slugifyValue(brief.slug) : "";
      addReviewItem({
        id: `brief:${brief.id ?? briefSlug ?? brief.headline}`,
        type: "brief",
        title: brief.headline ?? brief.title ?? "Brief",
        source: "_data/brief.json",
        reviewDate: reviewDateTime.toISODate(),
        reviewDateValue: reviewDateTime.toMillis()
      });
    }

    return reviewItems
      .sort((a, b) => {
        const diff = (a.reviewDateValue ?? 0) - (b.reviewDateValue ?? 0);
        if (diff !== 0) {
          return diff;
        }
        return String(a.title ?? "").localeCompare(String(b.title ?? ""));
      });
  });

  eleventyConfig.addCollection("caseStudies", function() {
    const { overproofGroups } = getProofCollections();

    return overproofGroups.map((group) => {
      const overproof = group?.overproof ?? {};
      const slug = overproof.slug ? slugifyValue(overproof.slug) : slugifyValue(overproof.title ?? overproof.id ?? "");
      const url = overproof.url ?? (slug ? `/briefs/${slug}/` : null);

      return {
        url,
        data: {
          overproofGroup: group,
          tasks: ["proof-record", "precedent"],
          intentOrder: Number.isFinite(overproof.order) ? overproof.order : Number.POSITIVE_INFINITY,
          title: overproof.title ?? overproof.short_title ?? slug
        }
      };
    });
  });

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

  const imageOutputDir = path.join("_site", "img");
  const imageCacheDir = path.join(".cache", "eleventy-img");
  const defaultImageWidths = [320, 640, 960, 1280, 1600];
  const defaultImageFormats = ["avif", "webp", "png"];

  async function imageShortcode(src, alt, options = {}) {
    if (!src) {
      throw new Error("`image` shortcode requires a `src` value");
    }

    if (alt === undefined) {
      throw new Error(`Missing \'alt\' text for image shortcode \"${src}\".`);
    }

    const {
      widths,
      formats,
      sizes,
      class: className,
      loading,
      decoding,
      fetchpriority,
      style,
      id,
      width,
      height,
      ariaHidden,
      attributes: customAttributes = {},
      background,
      filenameFormat,
      cacheOptions,
      sharpOptions,
      sharpWebpOptions,
      sharpAvifOptions,
      sharpPngOptions,
      sharpGifOptions
    } = options;

    let resolvedWidths = defaultImageWidths;
    if (Array.isArray(widths) && widths.length) {
      resolvedWidths = widths;
    } else if (widths === "auto" || widths === null) {
      resolvedWidths = ["auto"];
    }

    const resolvedFormats = Array.isArray(formats) && formats.length ? formats : defaultImageFormats;

    const imageOptions = {
      widths: resolvedWidths,
      formats: resolvedFormats,
      outputDir: imageOutputDir,
      urlPath: "/img/",
      cacheOptions: cacheOptions ?? {
        directory: imageCacheDir,
        duration: "1d"
      }
    };

    if (background) imageOptions.background = background;
    if (filenameFormat) imageOptions.filenameFormat = filenameFormat;
    if (sharpOptions) imageOptions.sharpOptions = sharpOptions;
    if (sharpWebpOptions) imageOptions.sharpWebpOptions = sharpWebpOptions;
    if (sharpAvifOptions) imageOptions.sharpAvifOptions = sharpAvifOptions;
    if (sharpPngOptions) imageOptions.sharpPngOptions = sharpPngOptions;
    if (sharpGifOptions) imageOptions.sharpGifOptions = sharpGifOptions;

    const source = typeof src === "string" && !src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("data:")
      ? path.join(process.cwd(), src.replace(/^\/+/u, ""))
      : src;

    const metadata = await Image(source, imageOptions);

    const imageAttributes = {
      alt,
      sizes: sizes ?? "100vw",
      loading: loading ?? "lazy",
      decoding: decoding ?? "async",
      ...customAttributes
    };

    if (className) imageAttributes.class = className;
    if (style) imageAttributes.style = style;
    if (id) imageAttributes.id = id;
    if (width !== undefined) imageAttributes.width = width;
    if (height !== undefined) imageAttributes.height = height;
    if (fetchpriority) imageAttributes.fetchpriority = fetchpriority;
    if (ariaHidden !== undefined) imageAttributes["aria-hidden"] = String(ariaHidden);

    return Image.generateHTML(metadata, imageAttributes, {
      whitespaceMode: "inline"
    });
  }

  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
  eleventyConfig.addAsyncShortcode("image", imageShortcode);
  eleventyConfig.addLiquidShortcode("image", (...args) => imageShortcode(...args));

  eleventyConfig.addPassthroughCopy("style.css");
  eleventyConfig.addPassthroughCopy("bundle.js");
  eleventyConfig.addPassthroughCopy("ga-consent.js");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy({ "_data/proofs.json": "data/proofs.json" });
  eleventyConfig.addPassthroughCopy({ "_data/overproofs.json": "data/overproofs.json" });
  eleventyConfig.addPassthroughCopy("files");
  eleventyConfig.addPassthroughCopy("_redirects");

  eleventyConfig.addWatchTarget("./style.css");
  eleventyConfig.addWatchTarget("./bundle.js");
  eleventyConfig.addWatchTarget("./ga-consent.js");

  eleventyConfig.addNunjucksGlobal("env", process.env);

  eleventyConfig.setServerOptions({
    showAllFiles: true
  });

  eleventyConfig.on("beforeWatch", () => {
    cachedProofCollections = null;
  });

  eleventyConfig.on("beforeBuild", () => {
    cachedProofCollections = null;
  });

  eleventyConfig.addTransform("htmlmin", async (content, outputPath) => {
    if (typeof outputPath === "string" && outputPath.endsWith(".html")) {
      try {
        return await htmlMinifier.minify(content, {
          collapseWhitespace: true,
          removeComments: true,
          useShortDoctype: true,
          removeRedundantAttributes: true,
          removeEmptyAttributes: true,
          minifyJS: true,
          minifyCSS: true
        });
      } catch (error) {
        console.warn("HTML minification failed for", outputPath, error);
      }
    }

    return content;
  });

  eleventyConfig.on("afterBuild", async () => {
    await generateSharePNGs();
  });

  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};
