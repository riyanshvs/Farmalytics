# Phase 3 Retrieval Audit Report

Generated at: 2026-03-15T06:28:58.332Z
Total tests: 280
Top1 exact rate: 0.7357
Top3 exact rate: 0.875
Top5 exact rate: 0.8929
Scheme name-match rates (Top1/Top3/Top5): 1 / 1 / 1
Strict misses recovered by scheme name match in Top5: 30
Top1 crop/category/stage match rates: 0.8607 / 0.975 / 0.775
Top1 quality-ok rate: 1
Average exact rank: 1.284
Misses: 30

## By Category

| Category | Tests | Top1 | Top3 | Top5 | Avg Rank | Misses |
|---|---:|---:|---:|---:|---:|---:|
| crop_stage | 40 | 0.75 | 0.975 | 1 | 1.325 | 0 |
| pest_disease | 40 | 0.35 | 1 | 1 | 1.95 | 0 |
| soil_health | 40 | 1 | 1 | 1 | 1 | 0 |
| irrigation | 40 | 1 | 1 | 1 | 1 | 0 |
| scheme | 40 | 0.05 | 0.15 | 0.25 | 3 | 30 |
| post_harvest | 40 | 1 | 1 | 1 | 1 | 0 |
| market | 40 | 1 | 1 | 1 | 1 | 0 |

## By Language

| Language | Tests | Top1 | Top3 | Top5 | Avg Rank | Misses |
|---|---:|---:|---:|---:|---:|---:|
| hi | 252 | 0.7817 | 0.9286 | 0.9405 | 1.257 | 15 |
| en | 28 | 0.3214 | 0.3929 | 0.4643 | 1.769 | 15 |

## Misses Preview

1. expected=kb-sc-okra-all-india-0031, crop=okra, category=scheme, language=hi
   query=PM-KISAN का लाभ लेने के लिए क्या प्रक्रिया है?
2. expected=kb-sc-okra-all-india-0031, crop=okra, category=scheme, language=en
   query=What is the process to apply for PM-KISAN?
3. expected=kb-sc-grapes-all-india-0046, crop=grapes, category=scheme, language=hi
   query=e-NAM का लाभ लेने के लिए क्या प्रक्रिया है?
4. expected=kb-sc-grapes-all-india-0046, crop=grapes, category=scheme, language=en
   query=What is the process to apply for e-NAM?
5. expected=kb-sc-groundnut-all-india-0061, crop=groundnut, category=scheme, language=hi
   query=PM-KISAN का लाभ लेने के लिए क्या प्रक्रिया है?
6. expected=kb-sc-groundnut-all-india-0061, crop=groundnut, category=scheme, language=en
   query=What is the process to apply for PM-KISAN?
7. expected=kb-sc-carrot-all-india-0076, crop=carrot, category=scheme, language=hi
   query=e-NAM का लाभ लेने के लिए क्या प्रक्रिया है?
8. expected=kb-sc-carrot-all-india-0076, crop=carrot, category=scheme, language=en
   query=What is the process to apply for e-NAM?
9. expected=kb-sc-muskmelon-all-india-0091, crop=muskmelon, category=scheme, language=hi
   query=PM-KISAN का लाभ लेने के लिए क्या प्रक्रिया है?
10. expected=kb-sc-muskmelon-all-india-0091, crop=muskmelon, category=scheme, language=en
   query=What is the process to apply for PM-KISAN?
