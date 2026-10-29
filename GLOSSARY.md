# GLOSSARY — Loka Travel Hybrid Recommendation System

Shared domain vocabulary for the Loka Travel Recommendation System (`d:\Code\recomendation-system-loka-travel`).

| Term | Definition | Mathematical / Code Representation |
| :--- | :--- | :--- |
| **Loka Travel Platform** | The unified travel package & hotel discovery web platform combining published **Memory-Based Collaborative Filtering** (Iswanto, Rachman, & Noorsyabani, 2025) with **Content-Based Filtering & Group-Based Room Allocation**. | `loka_recommender.py`, `app.py` |
| **Tour Package** | A curated destination experience (e.g., *Bukit Jamur Bandung*, *Gunung Anyar Surabaya*, *Gunung Agung Denpasar*, *Nusa Penida Kelingking Beach*) categorized into `Taman Hiburan`, `Camp`, `Mountain`, or `Beach`. | `TourPackage`, `tour_packages` catalog |
| **User Interaction Matrix** | The $U \times I$ rating matrix where each completed booking and payment automatically records a 5-star interaction (`rating = 5.0`), alongside explicit user ratings ($1.0\text{–}5.0$). | `interaction_matrix`, `U_1i`, `U_2i` |
| **User-Based Collaborative Filtering (UBCF)** | Memory-based collaborative filtering algorithm from the published journal paper that computes user-to-user cosine similarity $\cos(U_1, U_2) = \frac{\sum_{i=1}^n U_{1i} U_{2i}}{\sqrt{\sum_{i=1}^n U_{1i}^2}\sqrt{\sum_{i=1}^n U_{2i}^2}}$ and recommends items favored by the most similar peer user that the active user has not yet booked. | `recommend_collaborative()` |
| **MAE & System Accuracy** | Evaluation metrics from the published 5-fold cross-validation benchmark: $\text{MAE} = \frac{1}{n}\sum_{i=1}^n |y_{i,\text{pred}} - y_{i,\text{true}}| = 0.9689$ and $\text{Accuracy} = \left(\frac{5 - \text{MAE}}{5}\right) \times 100\% = 80.63\%$. | `evaluate_cf_metrics()` |
| **Reference Hotel** (`Hotel Referensi`) | The anchor hotel selected by a user or matched from a destination search to compute content similarity across the 797-hotel Indonesian catalog. | `reference_hotel`, `hotel_index` |
| **Combined Features** | Concatenated textual representation of a hotel's `name`, `city`, `region`, and `hotelFeatures`, stemmed and stopword-filtered into `processed_features`. | `combined_features`, `processed_features` |
| **Content Similarity** | Pairwise cosine similarity over TF-IDF vectors (`max_features=5000`) of `processed_features` (achieving $0.884$ relevance score across 797 hotels and 38 features). | `cosine_sim` |
| **Group-Based Recommendation** | Content-similar hotels filtered by a target nightly budget scaled by `group_size` (`price_factor` from $1.0$ to $2.5$ with a $\pm 30\%$ price band) and room allocation calculation. | `recommend_group_hotels()`, `allocate_rooms()` |
| **Advanced Group Recommendation** | Group-based hotel recommendations ranked by a weighted **Composite Score**: $0.5 \times \text{content\_similarity} + 0.3 \times \text{preference\_score} + 0.2 \times \text{demographic\_score}$ using bilingual (Indonesian + English) keyword matching for `adults`, `children`, and `seniors`. | `recommend_advanced_group_hotels()`, `composite_score` |
| **Hybrid Trip Bundle** | End-to-end itinerary pairing a Collaborative-Filtered **Tour Package** in a target destination with an Advanced Group-Filtered **Hotel** and automatic room allocation. | `recommend_hybrid_bundle()` |
