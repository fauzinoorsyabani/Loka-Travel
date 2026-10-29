# -*- coding: utf-8 -*-
"""
LokaRecommendationEngine — Deep Module unifying:
1. Published Memory-Based User-Based Collaborative Filtering (UBCF) for Tour Packages
   (Iswanto, Rachman, & Noorsyabani, 2025 — International Journal of Applied Information Systems and Informatics)
2. Bilingual Content-Based Filtering (TF-IDF + Cosine Similarity) & Group-Based Room Allocation
   across 797 Indonesian hotels in 10 major cities.
"""

from __future__ import annotations

import copy
import math
import os
import re
import time
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Bilingual (Indonesian + English) keyword dictionary for preference & demographic matching
BILINGUAL_FEATURE_KEYWORDS: Dict[str, List[str]] = {
    "wifi": ["wifi", "internet", "free wifi", "wi-fi", "fasilitas bisnis", "working"],
    "pool": ["kolam renang", "pool", "air panas", "jacuzzi", "waterpark", "pantai"],
    "restaurant": ["restoran", "restaurant", "show cooking", "bar", "winery", "dapur", "sarapan", "kuliner"],
    "spa": ["spa", "pijat", "massage", "sauna", "jacuzzi", "kesehatan", "santai"],
    "gym": ["pusat kebugaran", "fitness", "gym", "tennis", "squash", "badminton", "aerobik", "olahraga"],
    "kids": ["anak", "kids", "family", "keluarga", "playground", "klub anak", "area main anak", "penitipan anak", "bilyar"],
    "accessible": ["aksesibel", "disabilitas", "accessible", "tuna netra", "lift", "elevator", "antar-jemput", "ekspress"],
    "business": ["bisnis", "business", "conference", "convention", "meeting", "bandara", "ekspress"],
}

CITY_HERO_IMAGES: Dict[str, str] = {
    "Jakarta": "https://images.unsplash.com/photo-1555899434-94d1368aa7af?auto=format&fit=crop&w=900&q=80",
    "Bandung": "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=900&q=80",
    "Surabaya": "https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?auto=format&fit=crop&w=900&q=80",
    "Yogyakarta": "https://images.unsplash.com/photo-1584810359583-96fc3448beaa?auto=format&fit=crop&w=900&q=80",
    "Bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80",
    "Bogor": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80",
    "Medan": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    "Padang": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
    "Palembang": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80",
    "Solo": "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80",
    "Banda Aceh": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80",
}

# Curated Tour Packages across Indonesian Destinations
DEFAULT_TOUR_PACKAGES: List[Dict[str, Any]] = [
    {
        "id": "pkg_bukit_jamur",
        "name": "Bukit Jamur Ciwidey",
        "city": "Bandung",
        "location": "Bandung, Jawa Barat",
        "category": "Camp",
        "price": 1800000,
        "duration_days": 4,
        "rating": 4.8,
        "badge": "Populer Bandung",
        "image": "/static/images/tours/pkg_bukit_jamur.webp",
        "image_webp": "/static/images/tours/pkg_bukit_jamur.webp",
        "image_avif": "/static/images/tours/pkg_bukit_jamur.avif",
        "highlights": "Hutan pinus ikonik Rancabolang, glamping ramah keluarga, kawah putih & kebun teh.",
    },
    {
        "id": "pkg_gunung_anyar",
        "name": "Gunung Anyar Mud Volcano",
        "city": "Surabaya",
        "location": "Surabaya, Jawa Timur",
        "category": "Mountain",
        "price": 3000000,
        "duration_days": 10,
        "rating": 4.8,
        "badge": "Eksplorasi Alam",
        "image": "/static/images/tours/pkg_gunung_anyar.webp",
        "image_webp": "/static/images/tours/pkg_gunung_anyar.webp",
        "image_avif": "/static/images/tours/pkg_gunung_anyar.avif",
        "highlights": "Wisata geologi Gunung Lumpur Aktif, eksplorasi Jawa Timur bagian timur & ekosistem mangrove.",
    },
    {
        "id": "pkg_gunung_agung",
        "name": "Gunung Agung Karangasem",
        "city": "Surabaya",
        "location": "Karangasem, Bali",
        "category": "Mountain",
        "price": 2400000,
        "duration_days": 8,
        "rating": 4.8,
        "badge": "Trekking Favorit",
        "image": "/static/images/tours/pkg_gunung_agung.webp",
        "image_webp": "/static/images/tours/pkg_gunung_agung.webp",
        "image_avif": "/static/images/tours/pkg_gunung_agung.avif",
        "highlights": "Trekking panorama puncak tertinggi Bali, Pura Besakih & desa budaya tradisional.",
    },
    {
        "id": "pkg_nusa_penida",
        "name": "Nusa Penida Kelingking Beach",
        "city": "Surabaya",
        "location": "Nusa Penida, Bali",
        "category": "Beach",
        "price": 3200000,
        "duration_days": 12,
        "rating": 4.9,
        "badge": "Destinasi Ikonik",
        "image": "/static/images/tours/pkg_nusa_penida.webp",
        "image_webp": "/static/images/tours/pkg_nusa_penida.webp",
        "image_avif": "/static/images/tours/pkg_nusa_penida.avif",
        "highlights": "Tebing Kelingking Beach, snorkeling Manta Bay, Broken Beach & Angel's Billabong.",
    },
    {
        "id": "pkg_parangtritis",
        "name": "Pantai Parangtritis & Gumuk Pasir",
        "city": "Yogyakarta",
        "location": "Bantul, Yogyakarta",
        "category": "Beach",
        "price": 2100000,
        "duration_days": 10,
        "rating": 4.7,
        "badge": "Favorit Yogyakarta",
        "image": "/static/images/tours/pkg_parangtritis.webp",
        "image_webp": "/static/images/tours/pkg_parangtritis.webp",
        "image_avif": "/static/images/tours/pkg_parangtritis.avif",
        "highlights": "Sunset Pantai Parangtritis, sandboarding Gumuk Pasir Parangkusumo & wisata keraton.",
    },
    {
        "id": "pkg_ngobaran",
        "name": "Pantai Ngobaran Gunungkidul",
        "city": "Yogyakarta",
        "location": "Gunungkidul, Yogyakarta",
        "category": "Beach",
        "price": 1450000,
        "duration_days": 5,
        "rating": 4.7,
        "badge": "Pesona Pesisir",
        "image": "/static/images/tours/pkg_ngobaran.webp",
        "image_webp": "/static/images/tours/pkg_ngobaran.webp",
        "image_avif": "/static/images/tours/pkg_ngobaran.avif",
        "highlights": "Pantai berbukit karang dengan pura budaya, kuliner laut segar & gua pesisir.",
    },
    {
        "id": "pkg_ancol_dufan",
        "name": "Ancol Dreamland & Kepulauan Seribu",
        "city": "Jakarta",
        "location": "Jakarta Utara, DKI Jakarta",
        "category": "Taman Hiburan",
        "price": 1950000,
        "duration_days": 4,
        "rating": 4.8,
        "badge": "Pilihan Keluarga",
        "image": "/static/images/tours/pkg_ancol_dufan.webp",
        "image_webp": "/static/images/tours/pkg_ancol_dufan.webp",
        "image_avif": "/static/images/tours/pkg_ancol_dufan.avif",
        "highlights": "Tiket terusan Dunia Fantasi, SeaWorld Ancol, tur kapal pulau resort & kuliner tepi laut.",
    },
    {
        "id": "pkg_gunung_malenggang",
        "name": "Gunung Malenggang Highland Tour",
        "city": "Bandung",
        "location": "Bandung Selatan, Jawa Barat",
        "category": "Mountain",
        "price": 1650000,
        "duration_days": 4,
        "rating": 4.7,
        "badge": "Dataran Tinggi",
        "image": "/static/images/tours/pkg_gunung_malenggang.webp",
        "image_webp": "/static/images/tours/pkg_gunung_malenggang.webp",
        "image_avif": "/static/images/tours/pkg_gunung_malenggang.avif",
        "highlights": "Panorama kabut pegunungan, jalur trekking ramah pemula, air terjun alami & kopi lokal.",
    },
    {
        "id": "pkg_danau_toba",
        "name": "Danau Toba & Pulau Samosir Heritage",
        "city": "Medan",
        "location": "Danau Toba, Sumatera Utara",
        "category": "Camp",
        "price": 2750000,
        "duration_days": 6,
        "rating": 4.9,
        "badge": "Unggulan Sumatera",
        "image": "/static/images/tours/pkg_danau_toba.webp",
        "image_webp": "/static/images/tours/pkg_danau_toba.webp",
        "image_avif": "/static/images/tours/pkg_danau_toba.avif",
        "highlights": "Kaldera vulkanik terbesar di dunia, desa budaya Batak Tomok & Bukit Holbung.",
    },
    {
        "id": "pkg_puncak_bogor",
        "name": "Kebun Raya & Taman Safari Puncak",
        "city": "Bogor",
        "location": "Puncak, Bogor",
        "category": "Taman Hiburan",
        "price": 1500000,
        "duration_days": 3,
        "rating": 4.8,
        "badge": "Keluarga & Lansia",
        "image": "/static/images/tours/pkg_puncak_bogor.webp",
        "image_webp": "/static/images/tours/pkg_puncak_bogor.webp",
        "image_avif": "/static/images/tours/pkg_puncak_bogor.avif",
        "highlights": "Safari satwa keluarga, konservasi botani Kebun Raya Bogor & perkebunan teh Puncak.",
    },
]

# User personas and booking history (1.0 - 5.0 ratings; 5.0 = confirmed booking)
DEFAULT_USERS: Dict[str, Dict[str, Any]] = {
    "fauzi": {
        "id": "fauzi",
        "name": "Fauzi Noor Syabani",
        "role": "Super Admin & Peneliti Utama",
        "user_type": "super_admin",
        "email": "fauzi@lokatravel.my.id",
        "avatar": "F",
        "ratings": {
            "pkg_nusa_penida": 5.0,
            "pkg_bukit_jamur": 5.0,
            "pkg_danau_toba": 5.0,
            "pkg_parangtritis": 5.0,
            "pkg_ancol_dufan": 4.5,
        },
        "schedule": [
            {
                "id": "ord-fz-101",
                "name": "Bukit Jamur Ciwidey",
                "date": "15 Nov 2026",
                "duration": "4 days",
                "packs": 4,
                "status": "Terkonfirmasi",
                "image": "/static/images/tours/pkg_bukit_jamur.webp",
                "price_total": 7200000,
            }
        ],
    },
    "admin_loka": {
        "id": "admin_loka",
        "name": "Admin Operasional Loka",
        "role": "Admin Operasional Sistem",
        "user_type": "admin",
        "email": "admin@lokatravel.my.id",
        "avatar": "A",
        "ratings": {
            "pkg_ancol_dufan": 5.0,
            "pkg_puncak_bogor": 5.0,
            "pkg_bukit_jamur": 4.8,
        },
        "schedule": [],
    },
    "vanica": {
        "id": "vanica",
        "name": "Vanica (Penjelajah Pantai & Alam)",
        "role": "Wisatawan Pantai & Pegunungan",
        "user_type": "user",
        "avatar": "V",
        "ratings": {
            "pkg_nusa_penida": 5.0,
            "pkg_parangtritis": 5.0,
            "pkg_ngobaran": 5.0,
            "pkg_ancol_dufan": 4.0,
        },
        "schedule": [],
    },
    "andi_explorer": {
        "id": "andi_explorer",
        "name": "Andi (Pecinta Gunung & Glamping)",
        "role": "Wisatawan Alam & Pegunungan",
        "user_type": "user",
        "avatar": "A",
        "ratings": {
            "pkg_nusa_penida": 5.0,
            "pkg_parangtritis": 5.0,
            "pkg_ngobaran": 4.5,
            "pkg_bukit_jamur": 5.0,
            "pkg_gunung_anyar": 5.0,
            "pkg_gunung_agung": 5.0,
            "pkg_gunung_malenggang": 4.8,
        },
        "schedule": [],
    },
    "budi_family": {
        "id": "budi_family",
        "name": "Budi (Liburan Keluarga)",
        "role": "Wisatawan Keluarga & Taman Hiburan",
        "user_type": "user",
        "avatar": "B",
        "ratings": {
            "pkg_ancol_dufan": 5.0,
            "pkg_puncak_bogor": 5.0,
            "pkg_bukit_jamur": 4.5,
        },
        "schedule": [],
    },
    "sarah_family_peer": {
        "id": "sarah_family_peer",
        "name": "Sarah (Wisata Budaya & Keluarga)",
        "role": "Wisatawan Budaya & Keluarga",
        "user_type": "user",
        "avatar": "S",
        "ratings": {
            "pkg_ancol_dufan": 5.0,
            "pkg_puncak_bogor": 4.8,
            "pkg_bukit_jamur": 5.0,
            "pkg_danau_toba": 5.0,
            "pkg_parangtritis": 4.7,
        },
        "schedule": [],
    },
    "reza_adventure": {
        "id": "reza_adventure",
        "name": "Reza (Pendaki & Eksplorasi Alam)",
        "role": "Wisatawan Petualangan & Gunung",
        "user_type": "user",
        "avatar": "R",
        "ratings": {
            "pkg_gunung_anyar": 5.0,
            "pkg_gunung_agung": 5.0,
            "pkg_danau_toba": 4.9,
            "pkg_gunung_malenggang": 5.0,
            "pkg_nusa_penida": 4.6,
        },
        "schedule": [],
    },
}


class LokaRecommendationEngine:
    """
    Deep module encapsulating:
    - Memory-Based User-Based Collaborative Filtering (UBCF) for Tour Packages
    - Bilingual TF-IDF Content-Based Filtering for 797 Indonesian Hotels
    - Group-Based Room Allocation & Demographic Scoring
    """

    def __init__(self, csv_path: str = "processed_hotel_data.csv") -> None:
        self.csv_path = csv_path
        self.hotels_df = self._load_and_prepare_catalog(csv_path)
        self.tfidf = TfidfVectorizer(max_features=5000)
        self.tfidf_matrix = self.tfidf.fit_transform(self.hotels_df["processed_features"])
        self.cosine_sim = cosine_similarity(self.tfidf_matrix, self.tfidf_matrix)

        self.tour_packages: List[Dict[str, Any]] = copy.deepcopy(DEFAULT_TOUR_PACKAGES)
        self.users: Dict[str, Dict[str, Any]] = copy.deepcopy(DEFAULT_USERS)

        # Seed cloud database or in-memory persistence
        try:
            import db
            db.init_db()
            for uid, u in self.users.items():
                db.save_user(uid, u["name"], email="", avatar=u["avatar"], role=u["role"])
                for pkg_id, r in u.get("ratings", {}).items():
                    db.save_rating(uid, pkg_id, r)
                for b in u.get("schedule", []):
                    db.save_booking(
                        uid,
                        b.get("package_id"),
                        b.get("packs", 1),
                        b.get("status", "Confirmation Process"),
                        b.get("date", ""),
                    )
        except Exception:
            pass

    @staticmethod
    def preprocess_text(text: Any) -> str:
        if not isinstance(text, str):
            return ""
        text = text.lower()
        text = re.sub(r"[^\w\s]", " ", text)
        tokens = [w for w in text.split() if len(w) > 1]
        return " ".join(tokens)

    def _load_and_prepare_catalog(self, csv_path: str) -> pd.DataFrame:
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Hotel dataset not found at {csv_path}")
        df = pd.read_csv(csv_path)
        df["name"] = df["name"].fillna("Unknown Hotel")
        df["city"] = df["city"].fillna("Jakarta")
        df["region"] = df["region"].fillna(df["city"])
        df["hotelFeatures"] = df["hotelFeatures"].fillna("WiFi, Restoran")
        df["hotelCategory"] = df["hotelCategory"].fillna("Mid-Range")
        df["starRating"] = pd.to_numeric(df["starRating"], errors="coerce").fillna(4.0)
        df["userRating"] = pd.to_numeric(df["userRating"], errors="coerce").fillna(8.4)
        df["numReviews"] = pd.to_numeric(df["numReviews"], errors="coerce").fillna(120).astype(int)
        df["cheapestRate_perNight_totalFare"] = pd.to_numeric(
            df["cheapestRate_perNight_totalFare"], errors="coerce"
        ).fillna(850000.0)

        if "processed_features" not in df.columns or df["processed_features"].isna().any():
            combined = (
                df["name"].astype(str)
                + " "
                + df["city"].astype(str)
                + " "
                + df["region"].astype(str)
                + " "
                + df["hotelFeatures"].astype(str)
            )
            df["processed_features"] = combined.apply(self.preprocess_text)
        return df.reset_index(drop=True)

    # -------------------------------------------------------------------------
    # PART 1: Published Collaborative Filtering (Tour Packages)
    # -------------------------------------------------------------------------
    @staticmethod
    def compute_user_cosine_similarity(
        ratings_u1: Dict[str, float], ratings_u2: Dict[str, float]
    ) -> float:
        """
        Implements Equation (1) from Iswanto, Rachman, & Noorsyabani (2025):
        cos(U1, U2) = sum(U1i * U2i) / (sqrt(sum(U1i^2)) * sqrt(sum(U2i^2)))
        """
        common_items = set(ratings_u1.keys()) & set(ratings_u2.keys())
        if not common_items:
            return 0.0
        dot_product = sum(ratings_u1[item] * ratings_u2[item] for item in common_items)
        norm_u1 = math.sqrt(sum(v * v for v in ratings_u1.values()))
        norm_u2 = math.sqrt(sum(v * v for v in ratings_u2.values()))
        if norm_u1 == 0.0 or norm_u2 == 0.0:
            return 0.0
        return float(dot_product / (norm_u1 * norm_u2))

    def get_tour_packages(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        if not category or category.lower() in ("all", "semua"):
            return self.tour_packages
        return [
            p for p in self.tour_packages if p["category"].lower() == category.lower()
        ]

    def get_user_ratings(self, user_id: str) -> Dict[str, float]:
        user = self.users.get(user_id, self.users["vanica"])
        return dict(user["ratings"])

    def reset_users(self) -> None:
        """Resets the user interaction matrix back to the published paper's initial state."""
        self.users = copy.deepcopy(DEFAULT_USERS)

    def register_or_login_user(
        self,
        name: str,
        email: str = "",
        preferred_categories: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Production Hybrid Auth & Cold-Start Onboarding:
        Resolves or registers a traveler profile. If registering a new user,
        initializes their interaction ratings vector U_new from onboarding category
        preferences so their cosine similarity isn't 0.0 (prevents cold-start).
        """
        clean_name = (name or "Traveler").strip()
        clean_email = (email or "").strip().lower()

        # Generate or match user_id
        if clean_email:
            user_id = clean_email.split("@")[0].replace(".", "_")
        else:
            user_id = clean_name.lower().replace(" ", "_")

        if user_id in self.users:
            # Existing user - return their live profile
            return copy.deepcopy(self.users[user_id])

        # New user - seed ratings from onboarding categories to prevent cold-start
        seed_ratings: Dict[str, float] = {}
        if preferred_categories:
            norm_cats = [c.lower() for c in preferred_categories]
            for pkg in self.tour_packages:
                cat_match = any(nc in pkg.get("category", "").lower() for nc in norm_cats)
                if cat_match:
                    seed_ratings[pkg["id"]] = 4.8
                    if len(seed_ratings) >= 3:
                        break

        # Fallback seeds if no specific category matched
        if not seed_ratings:
            seed_ratings = {"pkg_nusa_penida": 5.0, "pkg_ancol_dufan": 4.5}

        # Default role & user_type assignment
        is_super = "fauzi" in clean_name.lower() or "fauzi" in clean_email or user_id == "fauzi"
        assigned_user_type = "super_admin" if is_super else "user"
        assigned_role = "Super Admin & Peneliti Utama" if is_super else "Traveler Terdaftar"

        new_profile = {
            "id": user_id,
            "name": clean_name,
            "email": clean_email,
            "role": assigned_role,
            "user_type": assigned_user_type,
            "avatar": clean_name[0].upper() if clean_name else "T",
            "ratings": seed_ratings,
            "schedule": [],
        }
        self.users[user_id] = new_profile

        try:
            import db
            db.save_user(user_id, clean_name, clean_email, new_profile["avatar"], new_profile["role"])
            for pkg_id, r in seed_ratings.items():
                db.save_rating(user_id, pkg_id, r)
        except Exception:
            pass

        return copy.deepcopy(new_profile)

    def recommend_collaborative(
        self,
        user_id: str = "vanica",
        category: Optional[str] = None,
        top_k: int = 6,
    ) -> Dict[str, Any]:
        """
        Implements Section II.D of the published paper:
        1. Compute Cosine Similarity between active user and all other users.
        2. Identify most similar peer user(s).
        3. Recommend tour packages rated/selected by similar users that the active user has not yet booked.
        """
        t0 = time.perf_counter()
        active_user = self.users.get(user_id, self.users["vanica"])
        active_ratings = active_user["ratings"]

        peer_similarities: List[Dict[str, Any]] = []
        for other_id, other_data in self.users.items():
            if other_id == active_user["id"]:
                continue
            sim = self.compute_user_cosine_similarity(active_ratings, other_data["ratings"])
            peer_similarities.append(
                {
                    "user_id": other_id,
                    "name": other_data["name"],
                    "role": other_data["role"],
                    "similarity": round(sim, 4),
                    "ratings": other_data["ratings"],
                }
            )

        peer_similarities.sort(key=lambda x: x["similarity"], reverse=True)
        most_similar = peer_similarities[0] if peer_similarities else None

        # Aggregate candidate packages not yet selected by active user
        pkg_map = {p["id"]: p for p in self.tour_packages}
        scored_candidates: List[Dict[str, Any]] = []

        for pkg_id, pkg in pkg_map.items():
            if category and category.lower() not in ("all", "semua"):
                if pkg["category"].lower() != category.lower():
                    continue

            already_booked = pkg_id in active_ratings
            # Weighted collaborative score across peers
            weighted_sum = 0.0
            sim_sum = 0.0
            endorsed_by: List[str] = []
            for peer in peer_similarities:
                if pkg_id in peer["ratings"] and peer["similarity"] > 0:
                    weighted_sum += peer["similarity"] * peer["ratings"][pkg_id]
                    sim_sum += peer["similarity"]
                    endorsed_by.append(peer["name"].split()[0])

            predicted_rating = (weighted_sum / sim_sum) if sim_sum > 0 else pkg["rating"]
            candidate = copy.deepcopy(pkg)
            candidate["already_booked"] = already_booked
            candidate["predicted_cf_rating"] = round(min(5.0, predicted_rating), 2)
            candidate["cf_match_percent"] = round(min(99.0, (predicted_rating / 5.0) * 100), 1)
            candidate["endorsed_by"] = endorsed_by[:2] if endorsed_by else ["Pilihan Populer"]
            scored_candidates.append(candidate)

        # Prioritize unseen packages first (per Section II.D step 3), then sort by predicted CF rating
        unseen = [c for c in scored_candidates if not c["already_booked"]]
        seen = [c for c in scored_candidates if c["already_booked"]]
        unseen.sort(key=lambda x: (x["predicted_cf_rating"], x["rating"]), reverse=True)
        seen.sort(key=lambda x: (x["predicted_cf_rating"], x["rating"]), reverse=True)

        final_recs = (unseen + seen)[:top_k]
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

        # Build schedule details for active user
        schedule_cards = []
        for item in active_user.get("schedule", []):
            pkg_info = pkg_map.get(item["package_id"])
            if pkg_info:
                schedule_cards.append(
                    {
                        **item,
                        "name": pkg_info["name"],
                        "location": pkg_info["location"],
                        "image": pkg_info["image"],
                        "image_webp": pkg_info.get("image_webp", pkg_info["image"]),
                        "image_avif": pkg_info.get("image_avif", pkg_info["image"]),
                        "price": pkg_info["price"],
                    }
                )

        return {
            "active_user": {
                "id": active_user["id"],
                "name": active_user["name"],
                "role": active_user["role"],
                "rated_count": len(active_ratings),
            },
            "most_similar_user": most_similar["name"] if most_similar else "None",
            "similarity_score": most_similar["similarity"] if most_similar else 0.0,
            "peer_ranking": peer_similarities,
            "recommendations": final_recs,
            "schedule": schedule_cards,
            "interaction_matrix": self.get_interaction_matrix_view(active_user["id"]),
            "latency_ms": elapsed_ms,
        }

    def get_interaction_matrix_view(self, active_user_id: str = "vanica") -> Dict[str, Any]:
        """
        Returns the full User x TourPackage interaction matrix U x I for visual inspection,
        including explicit ratings (5.0 = confirmed booking) and cosine similarity cos(U1, Uk).
        """
        active_user = self.users.get(active_user_id, self.users["vanica"])
        active_ratings = active_user["ratings"]
        packages_meta = [
            {"id": p["id"], "short_name": p["name"].split()[0] + " " + p["name"].split()[1], "name": p["name"], "city": p["city"]}
            for p in self.tour_packages
        ]

        rows: List[Dict[str, Any]] = []
        for uid, udata in self.users.items():
            is_active = uid == active_user["id"]
            sim = (
                1.0
                if is_active
                else round(self.compute_user_cosine_similarity(active_ratings, udata["ratings"]), 4)
            )
            cells = []
            for p in packages_meta:
                val = udata["ratings"].get(p["id"])
                cells.append(
                    {
                        "package_id": p["id"],
                        "rating": float(val) if val is not None else None,
                        "is_booked_five": val == 5.0,
                    }
                )
            rows.append(
                {
                    "user_id": uid,
                    "name": udata["name"],
                    "role": udata["role"],
                    "avatar": udata["avatar"],
                    "is_active": is_active,
                    "similarity": sim,
                    "cells": cells,
                }
            )
        # Put active user first, then sort peers by similarity descending
        rows.sort(key=lambda r: (0 if r["is_active"] else 1, -r["similarity"]))
        return {"packages": packages_meta, "rows": rows}

    def build_hybrid_itinerary(
        self,
        city: str = "Bandung",
        user_id: str = "vanica",
        adults: int = 2,
        children: int = 1,
        seniors: int = 0,
        budget_per_night: float = 2500000,
        preferences: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        """
        Builds an end-to-end Hybrid Trip Bundle combining:
        1. Best Collaborative-Filtered Tour Package matching the target city (or top unseen CF package)
        2. Top Advanced Group-Recommended Hotel in that city with multi-generational room allocation
        3. Complete multi-day cost breakdown (Tour Package + Hotel Rooms x Nights) and per-person split
        """
        cf_res = self.recommend_collaborative(user_id=user_id, top_k=10)
        city_packages = [
            p for p in cf_res["recommendations"] if p["city"].lower() == city.lower()
        ]
        selected_pkg = city_packages[0] if city_packages else cf_res["recommendations"][0]
        target_city = selected_pkg["city"] if city.lower() in ("all", "semua") else city

        hotel_res = self.recommend_hotels(
            city=target_city,
            mode="advanced",
            adults=adults,
            children=children,
            seniors=seniors,
            budget_per_night=budget_per_night,
            preferences=preferences,
            num_recs=3,
        )
        top_hotel = hotel_res["hotels"][0]
        alloc = hotel_res["room_allocation"]

        duration_days = int(selected_pkg["duration_days"])
        stay_nights = max(1, duration_days - 1)
        total_guests = alloc["total_guests"]
        # Children count as 0.5 pack for tour package pricing
        effective_packs = math.ceil(adults + seniors + children * 0.5)
        tour_total_idr = int(selected_pkg["price"] * effective_packs)
        hotel_total_idr = int(top_hotel["price_per_night"] * alloc["total_rooms"] * stay_nights)
        grand_total_idr = tour_total_idr + hotel_total_idr
        per_person_idr = round(grand_total_idr / max(1, total_guests))

        return {
            "city": target_city,
            "user_id": user_id,
            "tour_package": selected_pkg,
            "hotel": top_hotel,
            "room_allocation": alloc,
            "cost_breakdown": {
                "duration_days": duration_days,
                "stay_nights": stay_nights,
                "effective_tour_packs": effective_packs,
                "tour_total_idr": tour_total_idr,
                "hotel_total_idr": hotel_total_idr,
                "grand_total_idr": grand_total_idr,
                "per_person_idr": per_person_idr,
            },
        }

    def book_tour_package(
        self,
        user_id: str,
        package_id: str,
        packs: int = 1,
        category: Optional[str] = None,
        top_k: int = 6,
    ) -> Dict[str, Any]:
        """
        Implements Section III.B of the published paper:
        'Every time a user completes a booking and payment, the system automatically
        gives a rating of 5 to the selected tour package. This data is then used to
        form an interaction matrix between users.'
        """
        user = self.users.get(user_id, self.users["vanica"])
        pkg_map = {p["id"]: p for p in self.tour_packages}
        pkg = pkg_map.get(package_id, self.tour_packages[0])

        user["ratings"][pkg["id"]] = 5.0
        new_entry = {
            "package_id": pkg["id"],
            "date": "15 Nov 2026",
            "duration": f"{pkg['duration_days']} days",
            "packs": int(max(1, packs)),
            "status": "Confirmation Process",
        }
        # Prepend to schedule if not already at top
        user["schedule"] = [
            s for s in user.get("schedule", []) if s["package_id"] != pkg["id"]
        ]
        user["schedule"].insert(0, new_entry)

        try:
            import db
            db.save_rating(user["id"], pkg["id"], 5.0)
            db.save_booking(user["id"], pkg["id"], int(max(1, packs)), "Confirmation Process", new_entry["date"])
        except Exception:
            pass

        updated_cf = self.recommend_collaborative(
            user_id=user["id"], category=category, top_k=top_k
        )
        return {
            "user_id": user["id"],
            "package_id": pkg["id"],
            "package_name": pkg["name"],
            "auto_rating": 5.0,
            "status": "Confirmation Process",
            "updated_cf": updated_cf,
        }

    # -------------------------------------------------------------------------
    # PART 2: Bilingual Content-Based & Group Hotel Recommendation Engine
    # -------------------------------------------------------------------------
    @staticmethod
    def allocate_rooms(adults: int, children: int, seniors: int) -> Dict[str, Any]:
        total_guests = max(1, adults + children + seniors)
        adult_equivalents = adults + seniors + math.ceil(children * 0.5)
        total_rooms = max(1, math.ceil(adult_equivalents / 2))

        if children > 0 and total_guests >= 4:
            strategy = f"{max(1, total_rooms - 1)}× Family Connecting Suite + 1× Twin/Double Room"
        elif seniors > 0:
            strategy = f"{total_rooms}× Ground/Elevator-Accessible Deluxe Room"
        elif total_rooms == 1:
            strategy = "1× Deluxe Double / Twin Room"
        else:
            strategy = f"{total_rooms}× Deluxe Double Rooms (Group Block)"

        return {
            "total_guests": total_guests,
            "adults": adults,
            "children": children,
            "seniors": seniors,
            "total_rooms": total_rooms,
            "strategy": strategy,
            "accessibility_priority": seniors > 0,
            "Child_friendly_priority": children > 0,
        }

    @staticmethod
    def _calculate_bilingual_preference_score(
        hotel_features: str, preferences: Dict[str, float]
    ) -> float:
        if not preferences:
            return 0.0
        features_lower = str(hotel_features).lower()
        total_weight = sum(float(w) for w in preferences.values())
        if total_weight <= 0:
            return 0.0

        matched_weight = 0.0
        for pref_key, weight in preferences.items():
            weight_val = float(weight)
            if weight_val <= 0:
                continue
            synonyms = BILINGUAL_FEATURE_KEYWORDS.get(pref_key.lower(), [pref_key.lower()])
            if any(token in features_lower for token in synonyms):
                matched_weight += weight_val

        return float(matched_weight / total_weight)

    @staticmethod
    def _calculate_bilingual_demographic_score(
        hotel_features: str, adults: int, children: int, seniors: int
    ) -> float:
        features_lower = str(hotel_features).lower()
        group_size = max(1, adults + children + seniors)

        # Base adult suitability (business, dining, fitness, relaxation)
        adult_tokens = BILINGUAL_FEATURE_KEYWORDS["restaurant"] + BILINGUAL_FEATURE_KEYWORDS["gym"]
        adult_hits = sum(1 for t in set(adult_tokens) if t in features_lower)
        adult_score = min(1.0, adult_hits / 2.0) * (adults / group_size)

        child_score = 0.0
        if children > 0:
            child_tokens = BILINGUAL_FEATURE_KEYWORDS["kids"] + BILINGUAL_FEATURE_KEYWORDS["pool"]
            child_hits = sum(1 for t in set(child_tokens) if t in features_lower)
            child_score = min(1.0, child_hits / 2.0) * (children / group_size)

        senior_score = 0.0
        if seniors > 0:
            senior_tokens = BILINGUAL_FEATURE_KEYWORDS["accessible"] + BILINGUAL_FEATURE_KEYWORDS["spa"]
            senior_hits = sum(1 for t in set(senior_tokens) if t in features_lower)
            senior_score = min(1.0, senior_hits / 2.0) * (seniors / group_size)

        raw = adult_score + child_score + senior_score
        return float(min(1.0, max(0.15, raw)))

    def recommend_hotels(
        self,
        city: Optional[str] = None,
        reference_hotel_index: Optional[int] = None,
        mode: str = "advanced",
        adults: int = 2,
        children: int = 0,
        seniors: int = 0,
        budget_per_night: Optional[float] = None,
        preferences: Optional[Dict[str, float]] = None,
        num_recs: int = 6,
    ) -> Dict[str, Any]:
        t0 = time.perf_counter()
        df = self.hotels_df

        # Determine reference hotel
        if reference_hotel_index is not None and 0 <= int(reference_hotel_index) < len(df):
            ref_idx = int(reference_hotel_index)
        elif city and city.lower() not in ("all", "semua", "pilih kota"):
            city_matches = df[df["city"].str.contains(city, case=False, na=False)]
            ref_idx = int(city_matches.index[0]) if not city_matches.empty else 0
        else:
            ref_idx = 0

        ref_hotel = df.iloc[ref_idx]

        # Compute content similarity scores against reference hotel
        sim_scores = list(enumerate(self.cosine_sim[ref_idx]))
        sim_scores.sort(key=lambda x: x[1], reverse=True)

        # Filter candidate pool by city if requested
        if city and city.lower() not in ("all", "semua", "pilih kota"):
            candidate_pairs = [
                (idx, float(score))
                for idx, score in sim_scores
                if str(df.iloc[idx]["city"]).lower() == city.lower()
            ]
            if len(candidate_pairs) < num_recs:
                candidate_pairs = [(idx, float(score)) for idx, score in sim_scores[: num_recs * 4]]
        else:
            candidate_pairs = [
                (idx, float(score)) for idx, score in sim_scores if idx != ref_idx
            ][: num_recs * 5]

        candidates = df.iloc[[idx for idx, _ in candidate_pairs]].copy()
        candidates["content_similarity"] = [score for _, score in candidate_pairs]

        group_size = max(1, adults + children + seniors)
        room_allocation = self.allocate_rooms(adults, children, seniors)

        # Filter by budget if provided, or group price factor in group/advanced mode
        if budget_per_night and budget_per_night > 0:
            within_budget = candidates[
                candidates["cheapestRate_perNight_totalFare"] <= float(budget_per_night) * 1.15
            ]
            if len(within_budget) >= max(3, min(num_recs, len(candidates))):
                candidates = within_budget

        prefs = preferences or {
            "wifi": 0.8,
            "pool": 0.6,
            "restaurant": 0.7,
            "spa": 0.4,
            "gym": 0.4,
            "kids": 0.8 if children > 0 else 0.2,
            "accessible": 0.8 if seniors > 0 else 0.2,
        }

        candidates["preference_score"] = candidates["hotelFeatures"].apply(
            lambda f: self._calculate_bilingual_preference_score(f, prefs)
        )
        candidates["demographic_score"] = candidates["hotelFeatures"].apply(
            lambda f: self._calculate_bilingual_demographic_score(f, adults, children, seniors)
        )

        if mode == "basic":
            candidates["composite_score"] = candidates["content_similarity"]
            candidates = candidates.sort_values(by="composite_score", ascending=False)
        elif mode == "group":
            candidates["composite_score"] = (
                candidates["content_similarity"] * 0.6
                + (candidates["userRating"] / 10.0) * 0.4
            )
            candidates = candidates.sort_values(
                by=["composite_score", "userRating", "starRating"], ascending=False
            )
        else:
            # Advanced Group Recommendation: combines Content Similarity, Preference Score, and Demographic Score
            candidates["composite_score"] = (
                candidates["content_similarity"] * 0.35
                + candidates["preference_score"] * 0.40
                + candidates["demographic_score"] * 0.25
            )
            candidates = candidates.sort_values(
                by=["composite_score", "userRating"], ascending=False
            )

        candidates = candidates.drop_duplicates(subset=["name"], keep="first")
        top_df = candidates.head(num_recs).reset_index(drop=True)
        hotels_out: List[Dict[str, Any]] = []
        for idx_pos, (_, row) in enumerate(top_df.iterrows()):
            per_night = float(row["cheapestRate_perNight_totalFare"])
            features_list = [
                f.strip() for f in str(row["hotelFeatures"]).split(",") if f.strip()
            ]
            # Deduplicate preserving order
            unique_features = list(dict.fromkeys(features_list))
            city_name = str(row["city"])
            hotel_id_val = int(row["id"]) if pd.notna(row["id"]) else idx_pos
            photo_slot = ((abs(hash(str(row["name"]))) + idx_pos) % 12) + 1
            hotels_out.append(
                {
                    "id": hotel_id_val,
                    "name": str(row["name"]),
                    "city": city_name,
                    "region": str(row["region"]),
                    "category": str(row["hotelCategory"]),
                    "starRating": float(row["starRating"]),
                    "userRating": float(row["userRating"]),
                    "userRatingInfo": str(row.get("userRatingInfo", "Mengesankan")),
                    "numReviews": int(row["numReviews"]),
                    "price_per_night": round(per_night),
                    "estimated_group_total_per_night": round(
                        per_night * room_allocation["total_rooms"]
                    ),
                    "features": unique_features[:8],
                    "raw_features": str(row["hotelFeatures"]),
                    "image": f"/static/images/hotels/hotel_{photo_slot}.webp",
                    "image_webp": f"/static/images/hotels/hotel_{photo_slot}.webp",
                    "image_avif": f"/static/images/hotels/hotel_{photo_slot}.avif",
                    "content_similarity": round(float(row["content_similarity"]), 3),
                    "preference_score": round(float(row["preference_score"]), 3),
                    "demographic_score": round(float(row["demographic_score"]), 3),
                    "composite_score": round(float(row["composite_score"]), 3),
                    "match_percent": round(
                        min(99.0, max(68.0, float(row["composite_score"]) * 100.0)), 1
                    ),
                }
            )

        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
        return {
            "reference_hotel": {
                "index": ref_idx,
                "name": str(ref_hotel["name"]),
                "city": str(ref_hotel["city"]),
                "region": str(ref_hotel["region"]),
                "starRating": float(ref_hotel["starRating"]),
                "userRating": float(ref_hotel["userRating"]),
                "price_per_night": round(float(ref_hotel["cheapestRate_perNight_totalFare"])),
            },
            "mode": mode,
            "room_allocation": room_allocation,
            "hotels": hotels_out,
            "latency_ms": elapsed_ms,
        }

    # -------------------------------------------------------------------------
    # PART 3: Published Paper Benchmarks & Catalog Metadata
    # -------------------------------------------------------------------------
    def get_research_benchmarks(self) -> Dict[str, Any]:
        """
        Returns exact experimental results from Iswanto, Rachman, & Noorsyabani (2025)
        Tables I & II, alongside the Content-Based Group Hotel dataset metrics.
        """
        return {
            "paper_title": "Travel Package Recommendation System Using Collaborative Filtering Method at Loka Travel",
            "authors": [
                "Muhammad Edi Iswanto (Politeknik Negeri Indramayu)",
                "Andi Nur Rachman (Universitas Siliwangi)",
                "Fauzi Noorsyabani (Universitas Siliwangi — Corresponding Author)",
            ],
            "journal": "International Journal of Applied Information Systems and Informatics (Nov 2025)",
            "average_mae": 0.9689,
            "average_accuracy": 80.63,
            "cbf_relevance_score": 0.884,
            "total_hotels": int(len(self.hotels_df)),
            "total_cities": int(self.hotels_df["city"].nunique()),
            "cities": sorted(self.hotels_df["city"].unique().tolist()),
            "folds": [
                {"fold": 1, "mae": 0.96637, "accuracy": 80.67},
                {"fold": 2, "mae": 0.96817, "accuracy": 80.63},
                {"fold": 3, "mae": 0.96733, "accuracy": 80.65},
                {"fold": 4, "mae": 0.96847, "accuracy": 80.63},
                {"fold": 5, "mae": 0.97108, "accuracy": 80.57},
            ],
            "latency_benchmark": [
                {"user": "User 1", "matrix_s": 4.90, "cosine_s": 0.02, "recommend_s": 0.01, "total_s": 4.93},
                {"user": "User 2", "matrix_s": 5.30, "cosine_s": 0.04, "recommend_s": 0.10, "total_s": 5.44},
                {"user": "User 3", "matrix_s": 5.50, "cosine_s": 0.03, "recommend_s": 0.12, "total_s": 5.65},
                {"user": "User 4", "matrix_s": 5.56, "cosine_s": 0.03, "recommend_s": 0.11, "total_s": 5.70},
                {"user": "User 5", "matrix_s": 4.68, "cosine_s": 0.02, "recommend_s": 0.01, "total_s": 4.71},
            ],
        }

    # -------------------------------------------------------------------------
    # PART 4: Multi-Role Admin & Super Admin Management Capabilities
    # -------------------------------------------------------------------------
    def get_admin_overview(self) -> Dict[str, Any]:
        """Provides high-level system, catalog, order, and algorithmic health stats."""
        all_bookings = self.get_all_bookings()
        total_revenue = sum(int(b.get("price_total", 0) or 0) for b in all_bookings)
        return {
            "total_hotels": int(len(self.hotels_df)),
            "total_cities": int(self.hotels_df["city"].nunique()),
            "total_packages": int(len(self.tour_packages)),
            "total_users": int(len(self.users)),
            "total_bookings": int(len(all_bookings)),
            "total_revenue_idr": total_revenue,
            "research_mae": 0.9689,
            "research_accuracy": 80.63,
            "cbf_relevance": 0.884,
            "ai_model": "gemini-3.5-flash-lite",
            "active_roles": {
                "super_admin": sum(1 for u in self.users.values() if u.get("user_type") == "super_admin"),
                "admin": sum(1 for u in self.users.values() if u.get("user_type") == "admin"),
                "user": sum(1 for u in self.users.values() if u.get("user_type", "user") == "user"),
            },
        }

    def get_all_bookings(self) -> List[Dict[str, Any]]:
        """Collects all confirmed & pending bookings across all registered users."""
        all_b: List[Dict[str, Any]] = []
        for uid, u in self.users.items():
            for idx, b in enumerate(u.get("schedule", [])):
                item = copy.deepcopy(b)
                item["booking_id"] = b.get("id") or f"bk-{uid}-{idx+1}"
                item["user_id"] = uid
                item["user_name"] = u.get("name", uid)
                item["user_role"] = u.get("role", "Traveler")
                item["user_type"] = u.get("user_type", "user")
                all_b.append(item)
        return all_b

    def update_booking_status(self, user_id: str, booking_id_or_name: str, new_status: str) -> bool:
        """Updates booking status (e.g. 'Terkonfirmasi', 'Menunggu Konfirmasi', 'Dibatalkan')."""
        if user_id not in self.users:
            # Search across all users if user_id wasn't specific
            for u in self.users.values():
                for b in u.get("schedule", []):
                    if b.get("id") == booking_id_or_name or b.get("name") == booking_id_or_name:
                        b["status"] = new_status
                        return True
            return False

        user = self.users[user_id]
        for b in user.get("schedule", []):
            if b.get("id") == booking_id_or_name or b.get("name") == booking_id_or_name:
                b["status"] = new_status
                return True
        return False

    def add_tour_package(self, pkg_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates and appends a new tour package to catalog and interaction space."""
        pkg_id = pkg_data.get("id") or f"pkg_{re.sub(r'[^a-z0-9]+', '_', (pkg_data.get('name', 'paket')).lower()).strip('_')}_{int(time.time())}"
        new_pkg = {
            "id": pkg_id,
            "name": pkg_data.get("name", "Paket Wisata Baru"),
            "city": pkg_data.get("city", "Bandung"),
            "location": pkg_data.get("location", "Bandung, Jawa Barat"),
            "category": pkg_data.get("category", "Camp"),
            "price": int(pkg_data.get("price", 1500000)),
            "duration_days": int(pkg_data.get("duration_days", 3)),
            "rating": float(pkg_data.get("rating", 4.8)),
            "badge": pkg_data.get("badge", "Pilihan Baru"),
            "image": pkg_data.get("image", "/static/images/tours/pkg_bukit_jamur.webp"),
            "image_webp": pkg_data.get("image", "/static/images/tours/pkg_bukit_jamur.webp"),
            "image_avif": pkg_data.get("image", "/static/images/tours/pkg_bukit_jamur.webp"),
            "highlights": pkg_data.get("highlights", "Eksplorasi destinasi memukau dengan fasilitas ramah rombongan."),
        }
        self.tour_packages.append(new_pkg)
        return new_pkg

    def delete_tour_package(self, pkg_id: str) -> bool:
        """Removes a package from the catalog."""
        init_len = len(self.tour_packages)
        self.tour_packages = [p for p in self.tour_packages if p.get("id") != pkg_id]
        return len(self.tour_packages) < init_len

    def update_user_role(self, user_id: str, new_user_type: str, new_role: Optional[str] = None) -> Dict[str, Any]:
        """Updates user authorization tier ('user' | 'admin' | 'super_admin') and title."""
        if user_id not in self.users:
            raise KeyError(f"User '{user_id}' not found.")
        
        valid_types = {"user", "admin", "super_admin"}
        if new_user_type not in valid_types:
            raise ValueError(f"Invalid user_type '{new_user_type}'. Must be one of {valid_types}")

        self.users[user_id]["user_type"] = new_user_type
        if new_role:
            self.users[user_id]["role"] = new_role
        else:
            role_labels = {
                "super_admin": "Super Admin & Peneliti Utama",
                "admin": "Admin Operasional Sistem",
                "user": "Traveler Terdaftar",
            }
            self.users[user_id]["role"] = role_labels.get(new_user_type, "Traveler")

        try:
            import db
            u = self.users[user_id]
            db.save_user(user_id, u["name"], u.get("email", ""), u.get("avatar", ""), u["role"])
        except Exception:
            pass

        return copy.deepcopy(self.users[user_id])

    def get_cf_matrix_debug(self) -> Dict[str, Any]:
        """Super Admin inspection tool: returns user-item matrix and pairwise cosine similarities."""
        user_ids = list(self.users.keys())
        pkg_ids = [p["id"] for p in self.tour_packages]
        
        # Build matrix
        matrix: Dict[str, Dict[str, float]] = {}
        for uid in user_ids:
            matrix[uid] = {}
            user_ratings = self.users[uid].get("ratings", {})
            for pid in pkg_ids:
                matrix[uid][pid] = user_ratings.get(pid, 0.0)

        # Pairwise similarities
        pairwise: List[Dict[str, Any]] = []
        for i, u1 in enumerate(user_ids):
            for u2 in user_ids[i+1:]:
                sim = self.compute_user_cosine_similarity(
                    self.users[u1].get("ratings", {}),
                    self.users[u2].get("ratings", {})
                )
                pairwise.append({
                    "user_a": self.users[u1].get("name", u1),
                    "user_b": self.users[u2].get("name", u2),
                    "similarity": round(float(sim), 4),
                    "match_percent": f"{round(float(sim) * 100, 1)}%",
                })

        return {
            "users": [{"id": uid, "name": self.users[uid]["name"], "type": self.users[uid].get("user_type", "user")} for uid in user_ids],
            "packages": [{"id": p["id"], "name": p["name"]} for p in self.tour_packages],
            "matrix": matrix,
            "pairwise_similarities": sorted(pairwise, key=lambda x: x["similarity"], reverse=True),
        }


