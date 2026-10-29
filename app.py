from __future__ import annotations

import base64
import json
import os
from flask import Flask, jsonify, render_template, request, send_file, send_from_directory
import requests
import db
from loka_recommender import LokaRecommendationEngine

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "processed_hotel_data.csv")
PDF_PATH = os.path.join(
    BASE_DIR,
    "Travel Package Recommendation System Using Collaborative Filtering Method at Loka Travel.pdf",
)
GOOGLE_CLIENT_ID = os.environ.get(
    "GOOGLE_CLIENT_ID",
    "79331604162-1h51uaaqgsib8uqteb14017ic97t84ia.apps.googleusercontent.com",
)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

engine = LokaRecommendationEngine(CSV_PATH)


def call_gemini_chat(message: str, history: list | None = None, context: dict | None = None) -> dict:
    models = ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"]
    
    context_desc = ""
    if context:
        city = context.get("city", "Bandung")
        guests = context.get("guests", {})
        adults = guests.get("adults", 2)
        children = guests.get("children", 0)
        seniors = guests.get("seniors", 0)
        budget = context.get("budget", 2500000)
        context_desc = (
            f"\n\nContext Wisatawan Saat Ini:\n"
            f"- Kota Destinasi yang sedang dilihat: {city}\n"
            f"- Rombongan: {adults} Dewasa, {children} Anak-anak, {seniors} Lansia\n"
            f"- Batas Anggaran: Rp {budget:,}/malam\n"
        )

    system_instruction = (
        "Kamu adalah LokaBot, asisten AI resmi dari Loka Travel (lokatravel.my.id).\n"
        "Tugas utamamu adalah membantu wisatawan merencanakan liburan terbaik di Indonesia, "
        "merekomendasikan paket wisata menarik, serta menyarankan alokasi kamar hotel yang nyaman "
        "bagi keluarga, anak-anak, dan lansia di 797 hotel pilihan pada 11 kota besar Indonesia "
        "(Jakarta, Bandung, Yogyakarta, Surabaya, Bali/Denpasar, Medan, Padang, Palembang, Semarang, Solo, Bogor, Banda Aceh).\n"
        "Karakteristik jawaban:\n"
        "- Ramah, antusias, sopan, dan solutif dalam Bahasa Indonesia.\n"
        "- Berikan saran praktis, sebutkan nama tempat atau tips spesifik ramah anak/lansia bila relevan.\n"
        "- Ringkas dan terstruktur (maksimal 2-3 paragraf atau poin-poin yang mudah dibaca di mobile).\n"
        f"{context_desc}"
    )

    contents = []
    if history and isinstance(history, list):
        for turn in history[-6:]:
            role = "user" if turn.get("role") == "user" else "model"
            text = turn.get("text") or turn.get("content") or ""
            if text:
                contents.append({"role": role, "parts": [{"text": str(text)}]})

    contents.append({"role": "user", "parts": [{"text": str(message)}]})

    payload = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 600,
        },
    }

    payload_bytes = json.dumps(payload).encode("utf-8")

    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        try:
            req = requests.post(
                url,
                data=payload_bytes,
                headers={"Content-Type": "application/json"},
                timeout=12,
            )
            if req.status_code == 200:
                res = req.json()
                candidate = res.get("candidates", [{}])[0]
                reply_text = candidate.get("content", {}).get("parts", [{}])[0].get("text", "")
                if reply_text:
                    return {
                        "status": "ok",
                        "reply": reply_text.strip(),
                        "model": model,
                    }
        except Exception:
            continue

    # Fallback response
    return {
        "status": "ok",
        "reply": (
            "Halo! Saya LokaBot, asisten liburan Loka Travel. "
            "Untuk liburan rombongan yang nyaman, saya sarankan memilih paket wisata alam atau budaya "
            "dengan hotel yang memiliki fasilitas ramah anak (kolam renang & playground) serta akses lift untuk lansia. "
            "Coba eksplorasi katalog hotel di bawah atau pilih paket wisata yang Anda sukai!"
        ),
        "model": "fallback",
    }


@app.route("/")
def index():
    dist_index = os.path.join(BASE_DIR, "dist", "index.html")
    if os.path.exists(dist_index):
        with open(dist_index, "r", encoding="utf-8") as f:
            return f.read(), 200, {"Content-Type": "text/html; charset=utf-8"}
    root_index = os.path.join(BASE_DIR, "index.html")
    if os.path.exists(root_index) and not os.path.exists(os.path.join(BASE_DIR, "templates", "index.html")):
        with open(root_index, "r", encoding="utf-8") as f:
            return f.read(), 200, {"Content-Type": "text/html; charset=utf-8"}
    benchmarks = engine.get_research_benchmarks()
    cf_initial = engine.recommend_collaborative(user_id="vanica", top_k=6)
    hotel_initial = engine.recommend_hotels(
        city="Jakarta",
        mode="advanced",
        adults=2,
        children=1,
        seniors=0,
        budget_per_night=2500000,
        num_recs=6,
    )
    itinerary_initial = engine.build_hybrid_itinerary(
        city="Bandung",
        user_id="vanica",
        adults=2,
        children=1,
        seniors=0,
        budget_per_night=2500000,
    )
    users_list = [
        {"id": uid, "name": u["name"], "role": u["role"], "user_type": u.get("user_type", "user"), "avatar": u["avatar"]}
        for uid, u in engine.users.items()
    ]
    return render_template(
        "index.html",
        benchmarks=benchmarks,
        cf_initial=cf_initial,
        hotel_initial=hotel_initial,
        itinerary_initial=itinerary_initial,
        users_list=users_list,
        google_client_id=GOOGLE_CLIENT_ID,
    )


@app.route("/api/init", methods=["GET"])
def api_init():
    user_id = request.args.get("user_id", "vanica")
    if not user_id or user_id == "null":
        user_id = "vanica"
    city = request.args.get("city", "Bandung")
    benchmarks = engine.get_research_benchmarks()
    cf_initial = engine.recommend_collaborative(user_id=user_id, top_k=6)
    hotel_initial = engine.recommend_hotels(
        city=city if city != "All" else "Jakarta",
        mode="advanced",
        adults=2,
        children=1,
        seniors=0,
        budget_per_night=2500000,
        num_recs=6,
    )
    itinerary_initial = engine.build_hybrid_itinerary(
        city=city if city != "All" else "Bandung",
        user_id=user_id,
        adults=2,
        children=1,
        seniors=0,
        budget_per_night=2500000,
    )
    users_list = [
        {"id": uid, "name": u["name"], "role": u["role"], "user_type": u.get("user_type", "user"), "avatar": u["avatar"]}
        for uid, u in engine.users.items()
    ]
    return jsonify(
        {
            "status": "ok",
            "benchmarks": benchmarks,
            "cf_initial": cf_initial,
            "hotel_initial": hotel_initial,
            "itinerary_initial": itinerary_initial,
            "users_list": users_list,
            "google_client_id": GOOGLE_CLIENT_ID,
        }
    )


@app.route("/assets/<path:filename>", methods=["GET"])
def serve_dist_assets(filename):
    dist_assets = os.path.join(BASE_DIR, "dist", "assets")
    return send_from_directory(dist_assets, filename)


@app.route("/api/recommend", methods=["POST"])
def api_recommend():
    data = request.get_json(silent=True) or request.form.to_dict()
    city = data.get("city", "Jakarta")
    mode = data.get("mode", "advanced")
    ref_idx = data.get("reference_hotel_index")
    ref_idx = int(ref_idx) if ref_idx not in (None, "", "auto") else None

    adults = int(data.get("adults", 2))
    children = int(data.get("children", 0))
    seniors = int(data.get("seniors", 0))
    budget = float(data.get("budget_per_night", 2500000))
    num_recs = int(data.get("num_recs", 6))

    user_id = data.get("user_id", "vanica") or "vanica"
    if user_id == "null":
        user_id = "vanica"
    category = data.get("category", "All")

    preferences = data.get("preferences")
    if not isinstance(preferences, dict):
        preferences = {
            "wifi": float(data.get("pref_wifi", 0.8)),
            "pool": float(data.get("pref_pool", 0.7)),
            "restaurant": float(data.get("pref_restaurant", 0.7)),
            "spa": float(data.get("pref_spa", 0.5)),
            "gym": float(data.get("pref_gym", 0.5)),
            "kids": float(data.get("pref_kids", 0.8 if children > 0 else 0.3)),
            "accessible": float(data.get("pref_accessible", 0.8 if seniors > 0 else 0.3)),
        }

    hotel_res = engine.recommend_hotels(
        city=city,
        reference_hotel_index=ref_idx,
        mode=mode,
        adults=adults,
        children=children,
        seniors=seniors,
        budget_per_night=budget,
        preferences=preferences,
        num_recs=num_recs,
    )
    cf_res = engine.recommend_collaborative(
        user_id=user_id,
        category=category,
        top_k=6,
    )
    itinerary_res = engine.build_hybrid_itinerary(
        city=city,
        user_id=user_id,
        adults=adults,
        children=children,
        seniors=seniors,
        budget_per_night=budget,
        preferences=preferences,
    )
    return jsonify(
        {
            "status": "ok",
            "hotel_recommendations": hotel_res,
            "collaborative_filtering": cf_res,
            "hybrid_itinerary": itinerary_res,
        }
    )


@app.route("/api/itinerary", methods=["POST"])
def api_itinerary():
    data = request.get_json(silent=True) or request.form.to_dict()
    itinerary = engine.build_hybrid_itinerary(
        city=data.get("city", "Bandung"),
        user_id=data.get("user_id", "vanica"),
        adults=int(data.get("adults", 2)),
        children=int(data.get("children", 1)),
        seniors=int(data.get("seniors", 0)),
        budget_per_night=float(data.get("budget_per_night", 2500000)),
        preferences=data.get("preferences"),
    )
    return jsonify(itinerary)


@app.route("/api/book-package", methods=["POST"])
def api_book_package():
    data = request.get_json(silent=True) or request.form.to_dict()
    user_id = data.get("user_id", "vanica")
    package_id = data.get("package_id", "pkg_bukit_jamur")
    packs = int(data.get("packs", 1))
    category = data.get("category", "All")
    result = engine.book_tour_package(
        user_id=user_id, package_id=package_id, packs=packs, category=category, top_k=6
    )
    result["hybrid_itinerary"] = engine.build_hybrid_itinerary(
        city=data.get("city", "Bandung"),
        user_id=user_id,
        adults=int(data.get("adults", 2)),
        children=int(data.get("children", 1)),
        seniors=int(data.get("seniors", 0)),
        budget_per_night=float(data.get("budget_per_night", 2500000)),
    )
    return jsonify(result)


@app.route("/api/reset-matrix", methods=["POST"])
def api_reset_matrix():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id", "vanica") or "vanica"
    if user_id == "null":
        user_id = "vanica"
    category = data.get("category", "All")
    engine.reset_users()
    cf_res = engine.recommend_collaborative(user_id=user_id, category=category, top_k=6)
    itinerary_res = engine.build_hybrid_itinerary(
        city=data.get("city", "Bandung"),
        user_id=user_id,
        adults=int(data.get("adults", 2)),
        children=int(data.get("children", 1)),
        seniors=int(data.get("seniors", 0)),
        budget_per_night=float(data.get("budget_per_night", 2500000)),
    )
    return jsonify(
        {"status": "ok", "updated_cf": cf_res, "hybrid_itinerary": itinerary_res}
    )


@app.route("/api/auth/login", methods=["POST"])
def api_auth_login():
    data = request.get_json(silent=True) or request.form.to_dict()
    demo_user_id = data.get("user_id")
    if demo_user_id and demo_user_id in engine.users:
        user = engine.users[demo_user_id]
    else:
        name = data.get("name", "Fauzi")
        email = data.get("email", "")
        preferred_categories = data.get("preferred_categories", [])
        user = engine.register_or_login_user(
            name=name, email=email, preferred_categories=preferred_categories
        )

    users_list = [
        {"id": uid, "name": u["name"], "role": u["role"], "user_type": u.get("user_type", "user"), "avatar": u["avatar"]}
        for uid, u in engine.users.items()
    ]
    return jsonify({"status": "ok", "user": user, "users_list": users_list})


@app.route("/api/auth/me", methods=["GET"])
def api_auth_me():
    user_id = request.args.get("user_id", "vanica")
    user = engine.users.get(user_id, engine.users.get("vanica"))
    return jsonify({"status": "ok", "user": user})


@app.route("/api/auth/logout", methods=["POST"])
def api_auth_logout():
    return jsonify({"status": "ok", "message": "Logged out successfully"})


@app.route("/api/auth/google", methods=["POST"])
def api_auth_google():
    data = request.get_json(silent=True) or request.form.to_dict()
    credential = data.get("credential", "").strip()
    if not credential:
        return jsonify({"status": "error", "message": "Credential token diperlukan"}), 400

    google_user_info = None
    # 1. Verify token with Google TokenInfo API
    try:
        resp = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}",
            timeout=5,
        )
        if resp.status_code == 200:
            google_user_info = resp.json()
    except Exception:
        pass

    # 2. Fallback: Parse unverified JWT payload if network tokeninfo fails or offline test
    if not google_user_info:
        try:
            parts = credential.split(".")
            if len(parts) >= 2:
                payload_str = parts[1]
                padded = payload_str + "=" * ((4 - len(payload_str) % 4) % 4)
                decoded = base64.urlsafe_b64decode(padded.encode()).decode("utf-8")
                google_user_info = json.loads(decoded)
        except Exception:
            pass

    if not google_user_info or not google_user_info.get("email"):
        return jsonify({"status": "error", "message": "Verifikasi akun Google gagal"}), 401

    name = google_user_info.get("name") or google_user_info.get("email", "").split("@")[0]
    email = google_user_info.get("email", "")
    avatar = google_user_info.get("picture", "")

    user = engine.register_or_login_user(
        name=name,
        email=email,
        preferred_categories=data.get("preferred_categories", ["Beach", "Mountain"]),
    )
    if avatar:
        user["avatar"] = name[0].upper() if name else "G"
        user["avatar_url"] = avatar

    users_list = [
        {"id": uid, "name": u["name"], "role": u["role"], "user_type": u.get("user_type", "user"), "avatar": u["avatar"]}
        for uid, u in engine.users.items()
    ]
    return jsonify({"status": "ok", "user": user, "users_list": users_list})


@app.route("/api/db/status", methods=["GET"])
def api_db_status():
    connected = db.is_connected()
    return jsonify(
        {
            "status": "ok",
            "database": "TiDB Serverless Cloud",
            "connected": connected,
            "mode": "live_cloud" if connected else "in_memory_fallback",
        }
    )


@app.route("/api/metrics", methods=["GET"])
def api_metrics():
    return jsonify(engine.get_research_benchmarks())


@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    if not message:
        return jsonify({"status": "error", "message": "Pesan tidak boleh kosong"}), 400

    history = data.get("history", [])
    context = data.get("context", {})
    result = call_gemini_chat(message=message, history=history, context=context)
    return jsonify(result)


@app.route("/paper.pdf", methods=["GET"])
def download_paper_pdf():
    if os.path.exists(PDF_PATH):
        return send_file(PDF_PATH, mimetype="application/pdf")
    return jsonify({"error": "PDF not found"}), 404


# Legacy routes preserved for backward compatibility
@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.form or request.get_json(silent=True) or {}
    hotel_index = int(data.get("hotel_index", 0))
    num_recs = int(data.get("num_recs", 6))
    res = engine.recommend_hotels(reference_hotel_index=hotel_index, mode="basic", num_recs=num_recs)
    return jsonify(res["hotels"])


@app.route("/search", methods=["POST"])
def search():
    city = request.form.get("city", "Jakarta")
    guests = int(request.form.get("guests", 2))
    res = engine.recommend_hotels(city=city, mode="group", adults=guests, num_recs=6)
    return jsonify(res)


# -----------------------------------------------------------------------------
# Admin & Super Admin Management REST APIs
# -----------------------------------------------------------------------------
@app.route("/api/admin/overview", methods=["GET"])
def api_admin_overview():
    try:
        overview = engine.get_admin_overview()
        return jsonify({"status": "ok", "overview": overview})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/admin/users", methods=["GET"])
def api_admin_users():
    try:
        users = [
            {
                "id": uid,
                "name": u["name"],
                "email": u.get("email", ""),
                "role": u["role"],
                "user_type": u.get("user_type", "user"),
                "avatar": u["avatar"],
                "ratings_count": len(u.get("ratings", {})),
                "bookings_count": len(u.get("schedule", [])),
            }
            for uid, u in engine.users.items()
        ]
        return jsonify({"status": "ok", "users": users})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/admin/users/role", methods=["POST"])
def api_admin_update_user_role():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    new_user_type = data.get("user_type")
    new_role = data.get("role")

    if not user_id or not new_user_type:
        return jsonify({"status": "error", "message": "user_id dan user_type wajib diisi"}), 400

    try:
        updated = engine.update_user_role(user_id=user_id, new_user_type=new_user_type, new_role=new_role)
        return jsonify({"status": "ok", "user": updated})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@app.route("/api/admin/packages", methods=["GET", "POST"])
def api_admin_packages():
    if request.method == "GET":
        return jsonify({"status": "ok", "packages": engine.tour_packages})

    data = request.get_json(silent=True) or {}
    name = data.get("name")
    if not name:
        return jsonify({"status": "error", "message": "Nama paket wisata wajib diisi"}), 400

    try:
        new_pkg = engine.add_tour_package(data)
        return jsonify({"status": "ok", "package": new_pkg})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/admin/packages/<pkg_id>", methods=["DELETE"])
def api_admin_delete_package(pkg_id):
    try:
        success = engine.delete_tour_package(pkg_id)
        if success:
            return jsonify({"status": "ok", "message": f"Paket {pkg_id} berhasil dihapus"})
        return jsonify({"status": "error", "message": "Paket tidak ditemukan"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/admin/bookings", methods=["GET"])
def api_admin_bookings():
    try:
        bookings = engine.get_all_bookings()
        return jsonify({"status": "ok", "bookings": bookings})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/admin/bookings/status", methods=["POST"])
def api_admin_update_booking_status():
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id", "")
    booking_id = data.get("booking_id", "")
    new_status = data.get("status", "")

    if not booking_id or not new_status:
        return jsonify({"status": "error", "message": "booking_id dan status wajib disertakan"}), 400

    try:
        success = engine.update_booking_status(user_id=user_id, booking_id_or_name=booking_id, new_status=new_status)
        if success:
            return jsonify({"status": "ok", "message": f"Status pesanan {booking_id} berhasil diubah ke {new_status}"})
        return jsonify({"status": "error", "message": "Pesanan tidak ditemukan"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/admin/matrix", methods=["GET"])
def api_admin_matrix():
    try:
        matrix_debug = engine.get_cf_matrix_debug()
        return jsonify({"status": "ok", "matrix": matrix_debug})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/admin/recalculate", methods=["POST"])
def api_admin_recalculate():
    try:
        # Re-sync CF interactions & calculate pairwise user similarities
        matrix_debug = engine.get_cf_matrix_debug()
        return jsonify({
            "status": "ok",
            "message": "Matriks Collaborative Filtering & metrik rekomendasi berhasil dihitung ulang",
            "matrix": matrix_debug,
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
