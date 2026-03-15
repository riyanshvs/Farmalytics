import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { retrieveRelevantKnowledge } from "../src/services/ragService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const kbDir = path.join(__dirname, "..", "src", "data", "kb");
const reportJsonPath = path.join(kbDir, "phase3_retrieval_report.json");
const reportMdPath = path.join(kbDir, "phase3_retrieval_report.md");

const MAX_CASES_PER_CATEGORY = Number(process.env.PHASE3_CASES_PER_CATEGORY || 20);
const TOP_K = Number(process.env.PHASE3_TOP_K || 5);

const listKbFiles = () =>
  fs
    .readdirSync(kbDir)
    .filter((name) => /^\d{2}_.+\.json$/i.test(name))
    .sort();

const readEntries = () =>
  listKbFiles().flatMap((name) => {
    const full = path.join(kbDir, name);
    return JSON.parse(fs.readFileSync(full, "utf-8"));
  });

const isHindiText = (text = "") => /[\u0900-\u097F]/.test(text);

const pickEvenly = (items, count) => {
  if (items.length <= count) return items;
  const step = items.length / count;
  const result = [];
  for (let i = 0; i < count; i += 1) {
    result.push(items[Math.floor(i * step)]);
  }
  return result;
};

const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;

const normalizeSchemeName = (value = "") => {
  if (value === null || value === undefined) return "";
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f]+/g, "")
    .trim();
};

const updateBucket = (bucket, key, updater) => {
  if (!bucket[key]) {
    bucket[key] = {
      tests: 0,
      top1_exact: 0,
      top3_exact: 0,
      top5_exact: 0,
      scheme_tests: 0,
      top1_scheme_name_match: 0,
      top3_scheme_name_match: 0,
      top5_scheme_name_match: 0,
      strict_misses_with_scheme_top5_match: 0,
      top1_crop_match: 0,
      top1_stage_match: 0,
      top1_category_match: 0,
      top1_quality_ok: 0,
      avg_exact_rank: null,
      exact_rank_count: 0,
      exact_rank_total: 0,
      misses: 0,
    };
  }
  updater(bucket[key]);
};

const entryQualityOk = (entry) => {
  if (!entry) return false;
  return (
    nonEmpty(entry.content) &&
    nonEmpty(entry.contentHi) &&
    nonEmpty(entry.title) &&
    nonEmpty(entry.titleHi) &&
    Array.isArray(entry.tags) &&
    entry.tags.length >= 3
  );
};

const buildTestCases = (entries) => {
  const byCategory = entries.reduce((acc, entry) => {
    const key = entry.category || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const cases = [];

  for (const [category, categoryEntries] of Object.entries(byCategory)) {
    const sampled = pickEvenly(categoryEntries, MAX_CASES_PER_CATEGORY);

    for (const entry of sampled) {
      if (nonEmpty(entry.farmer_query)) {
        cases.push({
          expected: entry,
          query: entry.farmer_query,
          language: isHindiText(entry.farmer_query) ? "hi" : "en",
          category,
        });
      }

      if (nonEmpty(entry.farmer_query_en)) {
        cases.push({
          expected: entry,
          query: entry.farmer_query_en,
          language: isHindiText(entry.farmer_query_en) ? "hi" : "en",
          category,
        });
      }
    }
  }

  return cases;
};

const runAudit = async () => {
  const startedAt = new Date();
  const entries = readEntries();
  const testCases = buildTestCases(entries);

  const summary = {
    tests: 0,
    top1_exact: 0,
    top3_exact: 0,
    top5_exact: 0,
    scheme_tests: 0,
    top1_scheme_name_match: 0,
    top3_scheme_name_match: 0,
    top5_scheme_name_match: 0,
    strict_misses_with_scheme_top5_match: 0,
    top1_crop_match: 0,
    top1_stage_match: 0,
    top1_category_match: 0,
    top1_quality_ok: 0,
    exact_rank_total: 0,
    exact_rank_count: 0,
    misses: 0,
  };

  const byCategory = {};
  const byLanguage = {};
  const misses = [];

  for (const test of testCases) {
    const results = await retrieveRelevantKnowledge({ query: test.query, topK: TOP_K });
    const expectedId = test.expected.id;

    const rank = results.findIndex((item) => item.id === expectedId);
    const foundTop1 = rank === 0;
    const foundTop3 = rank >= 0 && rank < 3;
    const foundTop5 = rank >= 0 && rank < 5;

    const expectedSchemeNorm = normalizeSchemeName(test.expected.scheme_name);
    const schemeRelevant = expectedSchemeNorm.length > 0;
    const schemeRank = schemeRelevant
      ? results.findIndex((item) => normalizeSchemeName(item.scheme_name) === expectedSchemeNorm)
      : -1;
    const top1SchemeNameMatch = schemeRank === 0;
    const top3SchemeNameMatch = schemeRank >= 0 && schemeRank < 3;
    const top5SchemeNameMatch = schemeRank >= 0 && schemeRank < 5;

    const top1 = results[0] || null;
    const top1CropMatch = top1?.crop_id === test.expected.crop_id;
    const top1StageMatch = top1?.stage === test.expected.stage;
    const top1CategoryMatch = top1?.category === test.expected.category;
    const top1QualityOk = entryQualityOk(top1);

    summary.tests += 1;
    if (foundTop1) summary.top1_exact += 1;
    if (foundTop3) summary.top3_exact += 1;
    if (foundTop5) summary.top5_exact += 1;
    if (schemeRelevant) {
      summary.scheme_tests += 1;
      if (top1SchemeNameMatch) summary.top1_scheme_name_match += 1;
      if (top3SchemeNameMatch) summary.top3_scheme_name_match += 1;
      if (top5SchemeNameMatch) summary.top5_scheme_name_match += 1;
      if (!foundTop5 && top5SchemeNameMatch) summary.strict_misses_with_scheme_top5_match += 1;
    }
    if (top1CropMatch) summary.top1_crop_match += 1;
    if (top1StageMatch) summary.top1_stage_match += 1;
    if (top1CategoryMatch) summary.top1_category_match += 1;
    if (top1QualityOk) summary.top1_quality_ok += 1;

    if (rank >= 0) {
      summary.exact_rank_total += rank + 1;
      summary.exact_rank_count += 1;
    } else {
      summary.misses += 1;
      misses.push({
        expected_id: expectedId,
        expected_category: test.expected.category,
        expected_crop: test.expected.crop_id,
        query: test.query,
        language: test.language,
        top_results: results.map((r) => ({ id: r.id, category: r.category, crop_id: r.crop_id, stage: r.stage })),
      });
    }

    const applyStats = (bucket) => {
      bucket.tests += 1;
      if (foundTop1) bucket.top1_exact += 1;
      if (foundTop3) bucket.top3_exact += 1;
      if (foundTop5) bucket.top5_exact += 1;
      if (schemeRelevant) {
        bucket.scheme_tests += 1;
        if (top1SchemeNameMatch) bucket.top1_scheme_name_match += 1;
        if (top3SchemeNameMatch) bucket.top3_scheme_name_match += 1;
        if (top5SchemeNameMatch) bucket.top5_scheme_name_match += 1;
        if (!foundTop5 && top5SchemeNameMatch) bucket.strict_misses_with_scheme_top5_match += 1;
      }
      if (top1CropMatch) bucket.top1_crop_match += 1;
      if (top1StageMatch) bucket.top1_stage_match += 1;
      if (top1CategoryMatch) bucket.top1_category_match += 1;
      if (top1QualityOk) bucket.top1_quality_ok += 1;
      if (rank >= 0) {
        bucket.exact_rank_total += rank + 1;
        bucket.exact_rank_count += 1;
      } else {
        bucket.misses += 1;
      }
    };

    updateBucket(byCategory, test.category, applyStats);
    updateBucket(byLanguage, test.language, applyStats);
  }

  const finalize = (bucket) => {
    const withRates = {};
    for (const [key, stats] of Object.entries(bucket)) {
      withRates[key] = {
        ...stats,
        top1_exact_rate: stats.tests ? Number((stats.top1_exact / stats.tests).toFixed(4)) : 0,
        top3_exact_rate: stats.tests ? Number((stats.top3_exact / stats.tests).toFixed(4)) : 0,
        top5_exact_rate: stats.tests ? Number((stats.top5_exact / stats.tests).toFixed(4)) : 0,
        top1_scheme_name_match_rate: stats.scheme_tests
          ? Number((stats.top1_scheme_name_match / stats.scheme_tests).toFixed(4))
          : null,
        top3_scheme_name_match_rate: stats.scheme_tests
          ? Number((stats.top3_scheme_name_match / stats.scheme_tests).toFixed(4))
          : null,
        top5_scheme_name_match_rate: stats.scheme_tests
          ? Number((stats.top5_scheme_name_match / stats.scheme_tests).toFixed(4))
          : null,
        top1_crop_match_rate: stats.tests ? Number((stats.top1_crop_match / stats.tests).toFixed(4)) : 0,
        top1_stage_match_rate: stats.tests ? Number((stats.top1_stage_match / stats.tests).toFixed(4)) : 0,
        top1_category_match_rate: stats.tests ? Number((stats.top1_category_match / stats.tests).toFixed(4)) : 0,
        top1_quality_ok_rate: stats.tests ? Number((stats.top1_quality_ok / stats.tests).toFixed(4)) : 0,
        avg_exact_rank:
          stats.exact_rank_count > 0 ? Number((stats.exact_rank_total / stats.exact_rank_count).toFixed(3)) : null,
      };
    }
    return withRates;
  };

  const completedAt = new Date();

  const report = {
    phase: 3,
    objective: "RAG retrieval quality hardening",
    generated_at: completedAt.toISOString(),
    duration_ms: completedAt.getTime() - startedAt.getTime(),
    config: {
      max_cases_per_category: MAX_CASES_PER_CATEGORY,
      top_k: TOP_K,
    },
    corpus: {
      total_entries: entries.length,
      categories: [...new Set(entries.map((e) => e.category))].sort(),
    },
    tests: {
      total: summary.tests,
      top1_exact: summary.top1_exact,
      top3_exact: summary.top3_exact,
      top5_exact: summary.top5_exact,
      scheme_tests: summary.scheme_tests,
      top1_scheme_name_match: summary.top1_scheme_name_match,
      top3_scheme_name_match: summary.top3_scheme_name_match,
      top5_scheme_name_match: summary.top5_scheme_name_match,
      strict_misses_with_scheme_top5_match: summary.strict_misses_with_scheme_top5_match,
      top1_crop_match: summary.top1_crop_match,
      top1_stage_match: summary.top1_stage_match,
      top1_category_match: summary.top1_category_match,
      top1_quality_ok: summary.top1_quality_ok,
      misses: summary.misses,
      top1_exact_rate: summary.tests ? Number((summary.top1_exact / summary.tests).toFixed(4)) : 0,
      top3_exact_rate: summary.tests ? Number((summary.top3_exact / summary.tests).toFixed(4)) : 0,
      top5_exact_rate: summary.tests ? Number((summary.top5_exact / summary.tests).toFixed(4)) : 0,
      top1_scheme_name_match_rate: summary.scheme_tests
        ? Number((summary.top1_scheme_name_match / summary.scheme_tests).toFixed(4))
        : null,
      top3_scheme_name_match_rate: summary.scheme_tests
        ? Number((summary.top3_scheme_name_match / summary.scheme_tests).toFixed(4))
        : null,
      top5_scheme_name_match_rate: summary.scheme_tests
        ? Number((summary.top5_scheme_name_match / summary.scheme_tests).toFixed(4))
        : null,
      top1_crop_match_rate: summary.tests ? Number((summary.top1_crop_match / summary.tests).toFixed(4)) : 0,
      top1_stage_match_rate: summary.tests ? Number((summary.top1_stage_match / summary.tests).toFixed(4)) : 0,
      top1_category_match_rate: summary.tests ? Number((summary.top1_category_match / summary.tests).toFixed(4)) : 0,
      top1_quality_ok_rate: summary.tests ? Number((summary.top1_quality_ok / summary.tests).toFixed(4)) : 0,
      avg_exact_rank:
        summary.exact_rank_count > 0 ? Number((summary.exact_rank_total / summary.exact_rank_count).toFixed(3)) : null,
    },
    by_category: finalize(byCategory),
    by_language: finalize(byLanguage),
    misses_preview: misses.slice(0, 30),
  };

  fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2));

  const md = [
    "# Phase 3 Retrieval Audit Report",
    "",
    `Generated at: ${report.generated_at}`,
    `Total tests: ${report.tests.total}`,
    `Top1 exact rate: ${report.tests.top1_exact_rate}`,
    `Top3 exact rate: ${report.tests.top3_exact_rate}`,
    `Top5 exact rate: ${report.tests.top5_exact_rate}`,
    `Scheme name-match rates (Top1/Top3/Top5): ${report.tests.top1_scheme_name_match_rate ?? "n/a"} / ${report.tests.top3_scheme_name_match_rate ?? "n/a"} / ${report.tests.top5_scheme_name_match_rate ?? "n/a"}`,
    `Strict misses recovered by scheme name match in Top5: ${report.tests.strict_misses_with_scheme_top5_match}`,
    `Top1 crop/category/stage match rates: ${report.tests.top1_crop_match_rate} / ${report.tests.top1_category_match_rate} / ${report.tests.top1_stage_match_rate}`,
    `Top1 quality-ok rate: ${report.tests.top1_quality_ok_rate}`,
    `Average exact rank: ${report.tests.avg_exact_rank}`,
    `Misses: ${report.tests.misses}`,
    "",
    "## By Category",
    "",
    "| Category | Tests | Top1 | Top3 | Top5 | Avg Rank | Misses |",
    "|---|---:|---:|---:|---:|---:|---:|",
    ...Object.entries(report.by_category).map(
      ([category, stats]) =>
        `| ${category} | ${stats.tests} | ${stats.top1_exact_rate} | ${stats.top3_exact_rate} | ${stats.top5_exact_rate} | ${stats.avg_exact_rank ?? "-"} | ${stats.misses} |`
    ),
    "",
    "## By Language",
    "",
    "| Language | Tests | Top1 | Top3 | Top5 | Avg Rank | Misses |",
    "|---|---:|---:|---:|---:|---:|---:|",
    ...Object.entries(report.by_language).map(
      ([language, stats]) =>
        `| ${language} | ${stats.tests} | ${stats.top1_exact_rate} | ${stats.top3_exact_rate} | ${stats.top5_exact_rate} | ${stats.avg_exact_rank ?? "-"} | ${stats.misses} |`
    ),
    "",
    "## Misses Preview",
    "",
    ...report.misses_preview.slice(0, 10).map(
      (m, idx) =>
        `${idx + 1}. expected=${m.expected_id}, crop=${m.expected_crop}, category=${m.expected_category}, language=${m.language}\n   query=${m.query}`
    ),
    "",
  ].join("\n");

  fs.writeFileSync(reportMdPath, md);

  console.log(`Phase 3 audit complete: ${reportJsonPath}`);
  console.log(`Top1 exact rate: ${report.tests.top1_exact_rate}`);
  console.log(`Top3 exact rate: ${report.tests.top3_exact_rate}`);
  console.log(`Top5 exact rate: ${report.tests.top5_exact_rate}`);
  console.log(`Misses: ${report.tests.misses}`);
};

runAudit().catch((error) => {
  console.error("Phase 3 audit failed:", error);
  process.exitCode = 1;
});
