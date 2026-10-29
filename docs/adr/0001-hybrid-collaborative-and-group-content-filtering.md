# ADR 0001: Hybrid Collaborative Filtering and Group-Based Content Filtering Architecture

- **Status:** Accepted
- **Date:** 2026-10-29
- **Context:**
  - Our published research paper (*Travel Package Recommendation System Using Collaborative Filtering Method at Loka Travel*, IJAISI, Nov 2025) introduced a Memory-Based User Collaborative Filtering (UBCF) engine for Loka Travel tour packages (`5-Fold CV MAE = 0.9689`, `Accuracy = 80.63%`, `Avg Latency = 5.28s`).
  - Meanwhile, the repository's hotel subsystem (`hotel_recommender_app.py`, `app.py`, `hotel_recommender_cli.py`, `dataset_rekomendasi_hotel.py`) implemented TF-IDF Content-Based Filtering with Group Room Allocation across 797 Indonesian hotels, duplicated across 4 separate files.
  - Because tour packages and group hotel stays were isolated across separate prototypes, users could not plan a unified trip (Tour Package + Group Hotel + Total Cost) and cold-start users or new destinations lacked a complementary fallback.

## Decision

We unified both subsystems inside a single deep module: `LokaRecommendationEngine` in [`loka_recommender.py`](../../loka_recommender.py):

1. **Memory-Based User Collaborative Filtering (`recommend_tour_packages`, `record_package_booking`)**:
   - Implements Equation (1) user-user cosine similarity $\cos(U_1, U_2)$ over the $U \times I$ rating matrix.
   - Implements the Section III.B booking rule where completed bookings automatically assign a `5.0` rating in the interaction matrix.
   - Vectorizes similarity computation with NumPy/Scikit-Learn, reducing inference latency from `5,280 ms` (legacy PHP/MySQL loop) to `< 15 ms` (`350x` speedup).
2. **Content-Based Filtering + Group Room Allocation (`recommend_hotels`, `allocate_rooms`)**:
   - Computes TF-IDF cosine similarity over hotel features and combines it with weighted demographic suitability (`0.4 * TF-IDF + 0.3 * Preferences + 0.3 * Group Demographics`).
   - Allocates rooms deterministically based on `adults`, `children`, `seniors`, and `rooms_requested`.
3. **Smart Hybrid Trip Itinerary (`build_hybrid_itinerary`)**:
   - Pairs the top UBCF Tour Package with the top CBF Group Hotel (matching destination city where available) and computes end-to-end group & per-person costs.

## Consequences

- **Positive:** Zero code duplication across `app.py`, `hotel_recommender_app.py`, `hotel_recommender_cli.py`, and `dataset_rekomendasi_hotel.py`. Full alignment between the published journal paper and the live portfolio web application.
- **Negative:** In-memory state mutations (`record_package_booking`) on serverless functions (Vercel) reset across cold starts unless backed by an external store, which is acceptable and desirable for an interactive portfolio sandbox.

