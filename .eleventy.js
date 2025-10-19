// .eleventy.js
const { DateTime } = require("luxon");
const Image = require("@11ty/eleventy-img");
const fs = require("node:fs/promises");
const path = require("node:path");
const htmlMinifier = require("html-minifier-terser");
const nunjucks = require("nunjucks");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const slugifyImport = require("@sindresorhus/slugify");
const proofSchema = require("./schemas/proof.schema.json");

function cloneData(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

async function loadJsonFile(filePath, fallback = undefined) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Warning: unable to read ${filePath}`, error);
    }
  }

  return cloneData(fallback);
}

async function loadOptionalJson(relativePath, fallback = undefined) {
  const filePath = path.join(process.cwd(), relativePath);
  return loadJsonFile(filePath, fallback);
}

function asArray(value) {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function normalizeNavUrl(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  if (value.includes("#")) {
    return value.trim();
  }

  let normalized = value.trim();

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  if (normalized.endsWith("index.html")) {
    normalized = normalized.slice(0, -"index.html".length);
  }

  if (!normalized.endsWith("/")) {
    normalized = `${normalized}/`;
  }

  return normalized;
}

function isNavItemActiveForUrl(currentUrl = "/", item = {}) {
  if (!item) {
    return false;
  }

  const normalizedCurrent = normalizeNavUrl(currentUrl || "/");

  const exactMatches = [
    ...asArray(item.match),
    ...asArray(item.matchExact),
    ...asArray(item.active),
    ...asArray(item.activeMatch)
  ];

  for (const candidate of exactMatches) {
    const normalizedCandidate = normalizeNavUrl(candidate);
    if (normalizedCandidate && normalizedCandidate === normalizedCurrent) {
      return true;
    }
  }

  const prefixMatches = [
    ...asArray(item.matchPrefix),
    ...asArray(item.activePrefix),
    ...asArray(item.startsWith)
  ];

  if (item.url && !item.url.includes("#")) {
    prefixMatches.push(item.url);
  }

  for (const prefix of prefixMatches) {
    const normalizedPrefix = normalizeNavUrl(prefix);
    if (!normalizedPrefix) {
      continue;
    }

    if (
      normalizedCurrent === normalizedPrefix ||
      normalizedCurrent.startsWith(normalizedPrefix)
    ) {
      return true;
    }
  }

  return false;
}

const defaultNavigation = {
  primary: [
    { label: "Thesis", url: "/thesis/", matchPrefix: ["/thesis/"] },
    {
      label: "Cases",
      url: "/cases/",
      matchPrefix: ["/cases/"],
      submenu: []
    },
    { label: "Proof", url: "/archive/", match: ["/archive/", "/archive/index.html"], matchPrefix: ["/proofs/"] },
    {
      label: "Search",
      url: "/archive/#search-input",
      list_class: "nav-item-search",
      attributes: {
        "data-search-link": "",
        "aria-label": "Search proofs"
      }
    },
    { label: "Context", url: "/context/third-way/", matchPrefix: ["/context/"] },
    { label: "Overproofs", url: "/overproofs/", match: ["/overproofs/", "/overproofs/index.html"], matchPrefix: ["/briefs/"] },
    { label: "Action", url: "/action/", matchPrefix: ["/action/"] },
    { label: "About", url: "/about/", match: ["/about/", "/about/index.html"], matchPrefix: ["/method/", "/integrity", "/contact/"] },
    { label: "Submit Proof", url: "/submit/", link_class: "btn-nav-submit", match: ["/submit/", "/submit/index.html"] }
  ],
  quick: [
    { label: "Full Archive", url: "/archive/", match: ["/archive/", "/archive/index.html"] },
    { label: "Thesis", url: "/thesis/", matchPrefix: ["/thesis/"] },
    { label: "Cases", url: "/cases/", matchPrefix: ["/cases/"] },
    { label: "Overproofs", url: "/overproofs/", match: ["/overproofs/", "/overproofs/index.html"] },
    { label: "Action Guide", url: "/action/", matchPrefix: ["/action/"] },
    { label: "Submit Proof", url: "/submit/", match: ["/submit/", "/submit/index.html"] }
  ],
  footer: {
    groups: [
      {
        heading: "About",
        links: [
          { label: "About Us", url: "/about/" },
          { label: "Method", url: "/method/" },
          { label: "Proof of Integrity", url: "/integrity" },
          { label: "Contact", url: "/contact/" }
        ]
      },
      {
        heading: "Evidence",
        links: [
          { label: "Thesis", url: "/thesis/" },
          { label: "Cases", url: "/cases/" },
          { label: "Proof Archive", url: "/archive/" },
          { label: "Overproofs", url: "/overproofs/" }
        ]
      },
      {
        heading: "Organize",
        links: [
          { label: "Action Guide", url: "/action/" },
          { label: "Context", url: "/context/third-way/" },
          { label: "Submit Proof", url: "/submit/" }
        ]
      },
      {
        heading: "Legal",
        links: [{ label: "Privacy Policy", url: "/privacy" }]
      }
    ]
  }
};

async function loadCasesData() {
  const casesDir = path.join(process.cwd(), "_data", "cases");

  try {
    const entries = await fs.readdir(casesDir, { withFileTypes: true });
    const cases = [];

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        continue;
      }

      const filePath = path.join(casesDir, entry.name);
      const caseData = await loadJsonFile(filePath, {});
      if (!caseData || typeof caseData !== "object") {
        continue;
      }

      const slug = caseData.slug || slugifyValue(caseData.case_id || entry.name.replace(/\.json$/u, ""));
      cases.push({
        ...caseData,
        slug,
        fileName: entry.name
      });
    }

    return cases.sort((a, b) => {
      const caseDiff = compareCaseIds(a.case_id, b.case_id);
      if (caseDiff !== 0) {
        return caseDiff;
      }
      return String(a.title ?? "").localeCompare(String(b.title ?? ""));
    });
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Warning: unable to load cases directory", error);
    }
    return [];
  }
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateProofSchema = ajv.compile(proofSchema);
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

function validateProof(proof, index) {
  if (!proof || typeof proof !== "object" || Array.isArray(proof)) {
    console.error(`Proof at index ${index} is not a valid object.`);
    console.error("Proof data:", JSON.stringify(proof, null, 2));
    throw new Error(`Invalid proof data at index ${index}`);
  }

  const required = ["title", "case_id", "thesis", "date"];
  const missing = required.filter((field) => {
    const value = proof[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    console.error(`Proof ${index} missing required fields: ${missing.join(", ")}`);
    console.error("Proof data:", JSON.stringify(proof, null, 2));
    throw new Error(`Invalid proof data at index ${index}`);
  }

  const isValid = validateProofSchema(proof);

  if (!isValid) {
    const errors = validateProofSchema.errors ?? [];
    console.error(`Proof ${index} failed schema validation.`);
    for (const error of errors) {
      console.error(` • ${error.instancePath || "."} ${error.message}`);
    }
    console.error("Proof data:", JSON.stringify(proof, null, 2));
    throw new Error(`Invalid proof data at index ${index}`);
  }

  return proof;
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

  const validatedProofs = normalizedProofs.map((entry, index) => validateProof(entry, index));

  if (!validatedProofs.length) {
    console.warn("Warning: No proofs passed validation.");
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

  const sortedProofs = [...validatedProofs].sort(compareProofsByCaseId);

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
    if (!proofs || proofs.length === 0) {
      console.warn("Warning: sortedProofs collection is empty");
      return [];
    }
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

  eleventyConfig.addCollection("cases", function() {
    return loadCasesData().then((cases) =>
      cases.map((caseData) => ({
        data: {
          ...caseData,
          url: `/cases/${caseData.slug}/`
        },
        url: `/cases/${caseData.slug}/`
      }))
    );
  });

  eleventyConfig.addFilter("navIsActive", (pageUrl, item = {}) => isNavItemActiveForUrl(pageUrl, item));

  eleventyConfig.addFilter("navLinkClasses", (pageUrl, item = {}) => {
    const classes = [];
    if (item.link_class) {
      classes.push(item.link_class);
    }
    if (isNavItemActiveForUrl(pageUrl, item)) {
      classes.push("is-active");
    }
    return classes.join(" ").trim();
  });

  eleventyConfig.addFilter("titlecase", (value) => {
    if (value === undefined || value === null) {
      return "";
    }

    return String(value)
      .split(/[^A-Za-z0-9]+/u)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  });

  eleventyConfig.addFilter("date", (dateObj, format = "LLLL d, yyyy") => {
    if (!dateObj) return "";
    return DateTime.fromJSDate(new Date(dateObj), { zone: 'utc' }).toFormat(format);
  });

  eleventyConfig.addFilter("truncate", (str, length = 150) => {
    if (str === undefined || str === null) {
      return "";
    }

    if (typeof str !== "string") {
      str = String(str);
    }

    const trimmed = str.trim();
    if (trimmed.length <= length) {
      return trimmed;
    }

    const idx = trimmed.lastIndexOf(" ", length);
    const sliceEnd = idx > 0 ? idx : length;
    return `${trimmed.slice(0, sliceEnd).trimEnd()}…`;
  });

  eleventyConfig.addFilter("safe", function(value, path, fallback = "") {
    if (typeof path === "string") {
      if (!value) {
        return fallback;
      }

      const result = path.split(".").reduce((acc, key) => {
        if (acc === undefined || acc === null) {
          return undefined;
        }
        return acc[key];
      }, value);

      return result ?? fallback;
    }

    if (value === undefined || value === null) {
      return "";
    }

    if (value instanceof nunjucks.runtime.SafeString) {
      return value;
    }

    return new nunjucks.runtime.SafeString(value);
  });

  eleventyConfig.addFilter("isArray", (value) => Array.isArray(value));

  eleventyConfig.addFilter("isObject", (value) => value && typeof value === "object" && !Array.isArray(value));

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

  eleventyConfig.addGlobalData("nav", async () => {
    const structure = await loadOptionalJson("_data/site_structure.json", {});
    const navigation = structure?.navigation ?? {};
    return {
      primary: cloneData(navigation.primary ?? defaultNavigation.primary),
      quick: cloneData(navigation.quick ?? defaultNavigation.quick),
      footer: cloneData(navigation.footer ?? defaultNavigation.footer)
    };
  });

  eleventyConfig.addGlobalData("siteStructure", () => loadOptionalJson("_data/site_structure.json", {}));
  eleventyConfig.addGlobalData("thesis", () => loadOptionalJson("_data/thesis.json", {}));
  eleventyConfig.addGlobalData("thirdWayContext", () => loadOptionalJson("_data/third_way_context.json", {}));
  eleventyConfig.addGlobalData("alabamaMirror", () => loadOptionalJson("_data/alabama_mirror.json", {}));
  eleventyConfig.addGlobalData("casesData", () => loadCasesData());

  eleventyConfig.addWatchTarget("./style.css");
  eleventyConfig.addWatchTarget("./bundle.js");
  eleventyConfig.addWatchTarget("./ga-consent.js");
  eleventyConfig.addWatchTarget("./_data/site_structure.json");
  eleventyConfig.addWatchTarget("./_data/thesis.json");
  eleventyConfig.addWatchTarget("./_data/third_way_context.json");
  eleventyConfig.addWatchTarget("./_data/alabama_mirror.json");
  eleventyConfig.addWatchTarget("./_data/cases");

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
