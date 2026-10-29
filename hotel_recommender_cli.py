# -*- coding: utf-8 -*-
"""
Command-Line Adapter for LokaRecommendationEngine.
Supports both interactive CLI execution and non-interactive --demo mode.
"""

import argparse
import sys
from loka_recommender import LokaRecommendationEngine


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(
        description="Loka Travel AI — Hybrid CF Tour Package & Group Hotel CLI"
    )
    parser.add_argument("--city", type=str, default="Jakarta", help="Destination city")
    parser.add_argument("--user", type=str, default="Vanica", help="Active persona for CF Tour Packages")
    parser.add_argument("--adults", type=int, default=2, help="Number of adults")
    parser.add_argument("--children", type=int, default=1, help="Number of children")
    parser.add_argument("--seniors", type=int, default=0, help="Number of seniors")
    parser.add_argument("--num-recs", type=int, default=5, help="Number of recommendations")
    parser.add_argument("--interactive", action="store_true", help="Prompt interactively")
    args = parser.parse_args()

    engine = LokaRecommendationEngine("processed_hotel_data.csv")

    if args.interactive:
        print("Daftar Kota Tujuan:", ", ".join(engine.get_research_benchmarks()["cities"]))
        city = input("Pilih Kota Tujuan (default Jakarta): ").strip() or "Jakarta"
        adults = int(input("Jumlah Dewasa (default 2): ").strip() or "2")
        children = int(input("Jumlah Anak-anak (default 0): ").strip() or "0")
        seniors = int(input("Jumlah Lansia (default 0): ").strip() or "0")
        num_recs = int(input("Jumlah Rekomendasi (default 5): ").strip() or "5")
    else:
        city = args.city
        adults = args.adults
        children = args.children
        seniors = args.seniors
        num_recs = args.num_recs

    cf_result = engine.recommend_collaborative(user_id=args.user.lower(), top_k=3)
    print(f"\n=== [1] Rekomendasi Paket Wisata Collaborative Filtering (User: {cf_result['active_user']['name']}) ===")
    print(f"Peer Terdekat: {cf_result['most_similar_user']} (cos(U1, U2) = {cf_result['similarity_score']:.4f})\n")
    for idx, pkg in enumerate(cf_result["recommendations"], start=1):
        print(
            f"{idx}. {pkg['name']} ({pkg['location']} - {pkg['category']}) | "
            f"Rp {pkg['price']:,} / {pkg['duration_days']} hari | "
            f"Prediksi CF: {pkg['predicted_cf_rating']:.2f}/5.0 ({pkg['cf_match_percent']}%)"
        )

    result = engine.recommend_hotels(
        city=city,
        mode="advanced",
        adults=adults,
        children=children,
        seniors=seniors,
        num_recs=num_recs,
    )
    alloc = result["room_allocation"]
    print(f"\n=== [2] Rekomendasi Hotel Kelompok Content-Based ({city}) ===")
    print(f"Strategi Kamar ({alloc['total_guests']} Tamu -> {alloc['total_rooms']} Kamar): {alloc['strategy']}\n")
    for idx, h in enumerate(result["hotels"], start=1):
        stars = "*" * int(h["starRating"])
        print(f"{idx}. {h['name']} ({h['region']}) [{h['category']}]")
        print(f"   Rating: {stars} ({h['starRating']}/5 | User: {h['userRating']}/10 | {h['numReviews']:,} ulasan)")
        print(f"   Harga/Malam: Rp {h['price_per_night']:,} | Skor Komposit: {h['composite_score']}")
        print(f"   Fitur: {', '.join(h['features'][:5])}\n")


if __name__ == "__main__":
    main()
