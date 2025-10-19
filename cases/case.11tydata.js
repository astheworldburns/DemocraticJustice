module.exports = {
  layout: "layouts/case.njk",
  pagination: {
    data: "collections.cases",
    size: 1,
    alias: "caseEntry"
  },
  permalink: (data) => data.caseEntry.url,
  eleventyComputed: {
    title: (data) => data.caseEntry?.data?.title,
    case: (data) => data.caseEntry?.data
  }
};
