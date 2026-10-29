# ADR 0002: Bilingual Indonesian-English Feature Scoring for Hotel Catalog

- **Status:** Accepted
- **Date:** 2026-10-29
- **Context:**
  - The dataset [`processed_hotel_data.csv`](../../processed_hotel_data.csv) (`797` Indonesian hotels across 10 cities) stores `hotelFeatures` in Bahasa Indonesia (e.g., `Area main anak, Klub anak, Layanan pijat, Pusat kebugaran, Aksesibel bagi penyandang disabilitas, Taman, Kolam renang`).
  - However, the legacy scoring functions in `app.py`, `hotel_recommender_app.py`, and `dataset_rekomendasi_hotel.py` matched English-only tokens (`pool`, `spa`, `gym`, `kids`, `wheelchair`, `elevator`), and `dataset_rekomendasi_hotel.py` also overwrote the `score` accumulator inside the senior-citizen loop.
  - As a result, `preference_score` and `demographic_score` frequently evaluated to `0.0` even for hotels with explicit kid clubs or wheelchair accessibility.

## Decision

We introduced `BILINGUAL_FEATURE_KEYWORDS` in [`loka_recommender.py`](../../loka_recommender.py):

- Maps each canonical preference key (`pool`, `spa`, `gym`, `wifi`, `restaurant`, `parking`, `garden`, `family`, `accessible`, `kids`, `senior`) to both Indonesian and English tokens present in `processed_hotel_data.csv`.
- Expands user queries with bilingual synonyms before TF-IDF transformation (`_expand_query_bilingual`) so English queries match Indonesian catalog text seamlessly.
- Fixes the demographic score accumulation bug so children (`Area main anak`, `Klub anak`) and senior (`Aksesibel bagi penyandang disabilitas`, `Layanan pijat`, `Taman`) suitability combine additively and normalize cleanly to `[0.0, 1.0]`.

## Consequences

- **Positive:** Accurate, non-zero preference and demographic scoring across all 797 Indonesian hotels regardless of whether the user searches in English or Bahasa Indonesia.
- **Verification:** Covered by unit tests in [`tests/test_recommender.py`](../../tests/test_recommender.py).

