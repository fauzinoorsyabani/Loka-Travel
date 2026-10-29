# -*- coding: utf-8 -*-
"""dataset_rekomendasi_hotel.py

Refactored to delegate to the deep module `LokaRecommendationEngine` in `loka_recommender.py`,
preserving backward-compatible function interfaces while eliminating duplicated TF-IDF code
and fixing the demographic score accumulation bug.
"""

from typing import Dict, Any
import pandas as pd
from loka_recommender import LokaRecommendationEngine

_ENGINE: LokaRecommendationEngine | None = None


def _get_engine(file_path: str = "processed_hotel_data.csv") -> LokaRecommendationEngine:
    global _ENGINE
    if _ENGINE is None:
        _ENGINE = LokaRecommendationEngine(file_path)
    return _ENGINE


def preprocess_text(text: str) -> str:
    return LokaRecommendationEngine.preprocess_text(text)


def load_and_preprocess_data(file_path: str = "processed_hotel_data.csv") -> pd.DataFrame:
    return _get_engine(file_path).hotels_df


def create_tfidf_matrix(hotels_df: pd.DataFrame | None = None):
    return _get_engine().cosine_sim


def get_basic_recommendations(
    hotel_index: int, cosine_sim=None, hotels_df=None, num_recs: int = 10
) -> pd.DataFrame:
    res = _get_engine().recommend_hotels(
        reference_hotel_index=hotel_index, mode="basic", num_recs=num_recs
    )
    return pd.DataFrame(res["hotels"])


def get_group_recommendations(
    hotel_index: int, cosine_sim=None, hotels_df=None, group_size: int = 2, num_recs: int = 10
) -> pd.DataFrame:
    res = _get_engine().recommend_hotels(
        reference_hotel_index=hotel_index, mode="group", adults=group_size, num_recs=num_recs
    )
    return pd.DataFrame(res["hotels"])


def get_advanced_group_recommendations(
    hotel_index: int,
    cosine_sim=None,
    hotels_df=None,
    group_composition: Dict[str, int] | None = None,
    preferences: Dict[str, float] | None = None,
    num_recs: int = 10,
) -> pd.DataFrame:
    comp = group_composition or {"adults": 2, "children": 0, "seniors": 0}
    res = _get_engine().recommend_hotels(
        reference_hotel_index=hotel_index,
        mode="advanced",
        adults=comp.get("adults", 2),
        children=comp.get("children", 0),
        seniors=comp.get("seniors", 0),
        preferences=preferences,
        num_recs=num_recs,
    )
    return pd.DataFrame(res["hotels"])
