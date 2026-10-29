import unittest
import math
from loka_recommender import LokaRecommendationEngine


class TestLokaRecommendationEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = LokaRecommendationEngine("processed_hotel_data.csv")

    def setUp(self):
        self.engine.reset_users()

    def test_collaborative_filtering_cosine_similarity_and_unseen_recommendations(self):
        # Equation (1) from Iswanto, Rachman, & Noorsyabani (2025):
        # cos(U1, U2) = sum(U1i * U2i) / (sqrt(sum(U1i^2)) * sqrt(sum(U2i^2)))
        u1 = {"pkg_1": 5.0, "pkg_2": 4.0}
        u2 = {"pkg_1": 5.0, "pkg_2": 4.0, "pkg_3": 5.0}
        sim = self.engine.compute_user_cosine_similarity(u1, u2)
        # Expected: (25 + 16) / (sqrt(41) * sqrt(25 + 16 + 25)) = 41 / (sqrt(41) * sqrt(66))
        expected = 41.0 / (math.sqrt(41.0) * math.sqrt(66.0))
        self.assertAlmostEqual(sim, expected, places=4)

        # Recommend tour packages for active user 'vanica' (from Fig. 1 of paper)
        cf_res = self.engine.recommend_collaborative(user_id="vanica", top_k=4)
        self.assertIn("recommendations", cf_res)
        self.assertIn("most_similar_user", cf_res)
        self.assertGreater(cf_res["similarity_score"], 0.5)
        self.assertTrue(len(cf_res["recommendations"]) > 0)
        # Ensure paper destinations like Bukit Jamur or Gunung Anyar exist in catalog
        all_names = [p["name"] for p in self.engine.get_tour_packages()]
        self.assertIn("Bukit Jamur Ciwidey", all_names)
        self.assertIn("Gunung Anyar Mud Volcano", all_names)
        self.assertIn("Gunung Agung Karangasem", all_names)
        self.assertIn("Nusa Penida Kelingking Beach", all_names)

    def test_booking_auto_five_star_rating_updates_interaction_matrix(self):
        # Section III.B of paper: completing a booking automatically gives rating = 5
        booking = self.engine.book_tour_package(
            user_id="vanica",
            package_id="pkg_gunung_anyar",
            packs=2
        )
        self.assertEqual(booking["auto_rating"], 5.0)
        self.assertEqual(booking["status"], "Confirmation Process")
        user_ratings = self.engine.get_user_ratings("vanica")
        self.assertEqual(user_ratings.get("pkg_gunung_anyar"), 5.0)

    def test_published_paper_mae_and_accuracy_benchmark(self):
        # Equations (2) and (3) + Table II from paper:
        # Average MAE = 0.9689, Accuracy = ((5 - MAE) / 5) * 100% = 80.63%
        metrics = self.engine.get_research_benchmarks()
        self.assertAlmostEqual(metrics["average_mae"], 0.9689, places=4)
        self.assertAlmostEqual(metrics["average_accuracy"], 80.63, places=2)
        self.assertEqual(len(metrics["folds"]), 5)

    def test_bilingual_group_hotel_recommendations_and_room_allocation(self):
        # Test real Indonesian hotel features ("Area main anak", "Aksesibel bagi penyandang disabilitas", etc.)
        result = self.engine.recommend_hotels(
            city="Jakarta",
            mode="advanced",
            adults=4,
            children=2,
            seniors=1,
            budget_per_night=3500000,
            preferences={
                "wifi": 0.9,
                "pool": 0.8,
                "restaurant": 0.7,
                "spa": 0.6,
                "gym": 0.5,
                "kids": 0.9,
                "accessible": 0.9,
            },
            num_recs=5,
        )
        self.assertEqual(len(result["hotels"]), 5)
        top_hotel = result["hotels"][0]
        # Verify bilingual scoring actually produces > 0 scores on Indonesian dataset
        self.assertGreater(top_hotel["preference_score"], 0.0)
        self.assertGreater(top_hotel["demographic_score"], 0.0)
        self.assertGreater(top_hotel["composite_score"], 0.0)
        # Verify room allocation for 4 adults + 2 children + 1 senior = 7 guests
        allocation = result["room_allocation"]
        self.assertEqual(allocation["total_guests"], 7)
        self.assertGreaterEqual(allocation["total_rooms"], 2)
        self.assertTrue(allocation["accessibility_priority"])

    def test_flask_api_routes(self):
        from app import app
        client = app.test_client()

        # 1. GET /
        res_index = client.get("/")
        self.assertEqual(res_index.status_code, 200)
        self.assertIn(b"Loka Travel", res_index.data)

        # 2. POST /api/recommend
        res_rec = client.post(
            "/api/recommend",
            json={
                "city": "Bandung",
                "mode": "advanced",
                "adults": 2,
                "children": 2,
                "seniors": 1,
                "budget_per_night": 2500000,
                "user_id": "vanica",
                "category": "All",
                "preferences": {
                    "wifi": 0.9,
                    "pool": 0.8,
                    "restaurant": 0.7,
                    "spa": 0.5,
                    "gym": 0.4,
                    "kids": 0.9,
                    "accessible": 0.8,
                },
            },
        )
        self.assertEqual(res_rec.status_code, 200)
        payload = res_rec.get_json()
        self.assertIn("hotel_recommendations", payload)
        self.assertIn("collaborative_filtering", payload)
        self.assertGreater(len(payload["hotel_recommendations"]["hotels"]), 0)

        # 3. POST /api/book-package
        res_book = client.post(
            "/api/book-package",
            json={"user_id": "vanica", "package_id": "pkg_bukit_jamur", "packs": 2},
        )
        self.assertEqual(res_book.status_code, 200)
        book_data = res_book.get_json()
        self.assertEqual(book_data["auto_rating"], 5.0)
        self.assertEqual(book_data["status"], "Confirmation Process")

        # 4. POST /api/chat (LokaBot Gemini AI Assistant)
        res_chat = client.post(
            "/api/chat",
            json={
                "message": "Halo LokaBot, rekomendasi hotel di Bandung",
                "context": {"city": "Bandung", "budget": 2000000},
            },
        )
        self.assertEqual(res_chat.status_code, 200)
        chat_data = res_chat.get_json()
        self.assertIn("reply", chat_data)
        self.assertIn("status", chat_data)
        self.assertEqual(chat_data["status"], "ok")

    def test_interaction_matrix_view_and_hybrid_itinerary(self):
        matrix_view = self.engine.get_interaction_matrix_view(active_user_id="vanica")
        self.assertEqual(len(matrix_view["packages"]), 10)
        self.assertEqual(len(matrix_view["rows"]), len(self.engine.users))
        active_row = [r for r in matrix_view["rows"] if r["is_active"]][0]
        self.assertEqual(active_row["user_id"], "vanica")
        self.assertEqual(active_row["similarity"], 1.0)

        # Build end-to-end hybrid itinerary (Tour Package CF + Group Hotel CBF + Cost Breakdown)
        itinerary = self.engine.build_hybrid_itinerary(
            city="Bandung",
            user_id="vanica",
            adults=3,
            children=1,
            seniors=1,
            budget_per_night=2500000,
        )
        self.assertEqual(itinerary["city"], "Bandung")
        self.assertIn("tour_package", itinerary)
        self.assertIn("hotel", itinerary)
        self.assertIn("cost_breakdown", itinerary)
        self.assertGreater(itinerary["cost_breakdown"]["grand_total_idr"], 0)
        self.assertGreater(itinerary["cost_breakdown"]["per_person_idr"], 0)

    def test_webp_and_avif_assets_and_reset_endpoint(self):
        from app import app
        client = app.test_client()

        res_html = client.get("/")
        self.assertEqual(res_html.status_code, 200)
        html_text = res_html.data.decode("utf-8")
        self.assertIn('type="image/avif"', html_text)
        self.assertIn('type="image/webp"', html_text)
        self.assertIn("/static/images/logo.avif", html_text)
        self.assertIn("/static/images/logo.webp", html_text)
        self.assertIn("max-width: 1280px", html_text)
        self.assertIn("@keyframes heroKenBurns", html_text)
        self.assertIn("hero-zoom-media", html_text)
        self.assertIn("prefers-reduced-motion: reduce", html_text)
        self.assertIn("rgba(6, 31, 56, 0.68)", html_text)
        self.assertIn("rgba(11, 59, 104, 0.45)", html_text)
        self.assertIn('id="hero-quick-city"', html_text)
        self.assertIn('id="hero-quick-guests"', html_text)
        self.assertIn("Belum ada paket wisata terjadwal", html_text)
        self.assertIn('id="mobile-menu-btn"', html_text)
        self.assertIn('id="mobile-nav-drawer"', html_text)
        for forbidden_term in [
            r"$\cos",
            "$U_1$",
            "$U_2$",
            r"$U \times I$",
            "$U_k$",
            "IJAISI",
            "Fauzi Noorsyabani",
            "Iswanto",
            "Jurnal PDF",
            "Jurnal Ilmiah",
            "Tabel II",
            "5-Fold Cross-Validation",
            "Persamaan (1)",
            "BibTeX",
            "Paper Fig.",
            "Bagian III.B",
            "TF-IDF",
            "Popular Baseline",
            "Andi (0.",
            "id=\"research-paper\"",
        ]:
            self.assertNotIn(forbidden_term, html_text)

        # Verify logo, tour package, and hotel WebP & AVIF files return HTTP 200
        for asset in [
            "/static/images/logo.avif",
            "/static/images/logo.webp",
            "/static/images/tours/pkg_bukit_jamur.avif",
            "/static/images/tours/pkg_bukit_jamur.webp",
            "/static/images/hotels/hotel_1.avif",
            "/static/images/hotels/hotel_1.webp",
        ]:
            resp = client.get(asset)
            self.assertEqual(resp.status_code, 200, f"Asset failed: {asset}")
            self.assertGreater(len(resp.data), 500)
            resp.close()

        # Verify reset-matrix route restores initial ratings
        res_reset = client.post("/api/reset-matrix", json={"user_id": "vanica", "category": "All"})
        self.assertEqual(res_reset.status_code, 200)
        reset_data = res_reset.get_json()
        self.assertEqual(reset_data["updated_cf"]["active_user"]["rated_count"], 4)

    def test_hybrid_auth_and_cold_start_onboarding(self):
        # 1. Test engine method register_or_login_user with cold-start category preferences
        new_user = self.engine.register_or_login_user(
            name="Rian Traveler",
            email="rian@example.com",
            preferred_categories=["Beach", "Camp"],
        )
        self.assertEqual(new_user["id"], "rian")
        self.assertEqual(new_user["name"], "Rian Traveler")
        self.assertGreater(len(new_user["ratings"]), 0)

        # 2. Verify that cold-start seeded ratings produce valid collaborative recommendations
        cf_res = self.engine.recommend_collaborative(user_id="rian", top_k=4)
        self.assertIn("recommendations", cf_res)
        self.assertGreater(len(cf_res["recommendations"]), 0)

        # 3. Test Flask Auth API routes
        from app import app
        client = app.test_client()

        # Login / Register endpoint
        res_login = client.post(
            "/api/auth/login",
            json={
                "name": "Dewi Lestari",
                "email": "dewi@example.com",
                "preferred_categories": ["Mountain", "Taman Hiburan"],
            },
        )
        self.assertEqual(res_login.status_code, 200)
        login_json = res_login.get_json()
        self.assertEqual(login_json["status"], "ok")
        self.assertEqual(login_json["user"]["id"], "dewi")

        # Me endpoint
        res_me = client.get("/api/auth/me?user_id=dewi")
        self.assertEqual(res_me.status_code, 200)
        me_json = res_me.get_json()
        self.assertEqual(me_json["user"]["name"], "Dewi Lestari")

        # Logout endpoint
        res_logout = client.post("/api/auth/logout")
        self.assertEqual(res_logout.status_code, 200)

        # 4. Verify YC-grade UI elements in index.html
        res_index = client.get("/")
        html = res_index.data.decode("utf-8")
        self.assertIn("preset-family", html)
        self.assertIn("chip-wifi", html)
        self.assertIn("chip-pool", html)
        self.assertIn("pill-budget-25", html)
        self.assertIn("auth-modal", html)

    def test_tidb_database_layer_and_persistence(self):
        import db
        # 1. User operations
        u = db.save_user("test_user_1", "Test Traveler", "test@lokatravel.com", "T", "Traveler")
        self.assertEqual(u["id"], "test_user_1")
        fetched_u = db.get_user("test_user_1")
        self.assertIsNotNone(fetched_u)
        self.assertEqual(fetched_u["name"], "Test Traveler")

        # 2. Ratings operations
        db.save_rating("test_user_1", "pkg_nusa_penida", 4.9)
        ratings = db.get_user_ratings("test_user_1")
        self.assertEqual(ratings.get("pkg_nusa_penida"), 4.9)

        # 3. Booking operations
        bk = db.save_booking("test_user_1", "pkg_bukit_jamur", packs=2, status="Confirmed", booking_date="10 Dec 2026")
        self.assertEqual(bk["packs"], 2)
        bookings = db.get_user_bookings("test_user_1")
        self.assertGreater(len(bookings), 0)
        self.assertEqual(bookings[0]["package_id"], "pkg_bukit_jamur")

    def test_google_oauth_endpoint_and_db_status(self):
        import base64
        import json
        from app import app
        client = app.test_client()

        # 1. Test /api/db/status
        res_db = client.get("/api/db/status")
        self.assertEqual(res_db.status_code, 200)
        db_info = res_db.get_json()
        self.assertIn("database", db_info)
        self.assertIn("TiDB Serverless", db_info["database"])

        # 2. Test /api/auth/google with mock JWT payload
        header = base64.urlsafe_b64encode(b'{"alg":"RS256","typ":"JWT"}').decode().rstrip("=")
        payload = base64.urlsafe_b64encode(
            json.dumps({
                "sub": "google_12345678",
                "name": "Budi Google User",
                "email": "budi.google@lokatravel.my.id",
                "picture": "https://lh3.googleusercontent.com/photo.jpg"
            }).encode()
        ).decode().rstrip("=")
        signature = base64.urlsafe_b64encode(b"mock_signature").decode().rstrip("=")
        mock_jwt = f"{header}.{payload}.{signature}"

        res_g = client.post(
            "/api/auth/google",
            json={"credential": mock_jwt, "preferred_categories": ["Beach", "Mountain"]}
        )
        self.assertEqual(res_g.status_code, 200)
        g_json = res_g.get_json()
        self.assertEqual(g_json["status"], "ok")
        self.assertEqual(g_json["user"]["name"], "Budi Google User")
        self.assertEqual(g_json["user"]["email"], "budi.google@lokatravel.my.id")
        self.assertIn("pkg_nusa_penida", g_json["user"]["ratings"])

    def test_multi_role_and_admin_endpoints(self):
        """Tests RBAC multi-role capabilities, admin overview, package management, and booking status."""
        from app import app
        client = app.test_client()

        # 1. Admin Overview
        res_ov = client.get("/api/admin/overview")
        self.assertEqual(res_ov.status_code, 200)
        ov_data = res_ov.get_json()
        self.assertEqual(ov_data["status"], "ok")
        self.assertGreaterEqual(ov_data["overview"]["total_hotels"], 790)
        self.assertGreaterEqual(ov_data["overview"]["total_packages"], 10)
        self.assertEqual(ov_data["overview"]["active_roles"]["super_admin"], 1)

        # 2. Users list and Role Updates
        res_users = client.get("/api/admin/users")
        self.assertEqual(res_users.status_code, 200)
        u_list = res_users.get_json()["users"]
        fauzi_u = next(u for u in u_list if u["id"] == "fauzi")
        self.assertEqual(fauzi_u["user_type"], "super_admin")

        res_update_role = client.post(
            "/api/admin/users/role",
            json={"user_id": "vanica", "user_type": "admin"}
        )
        self.assertEqual(res_update_role.status_code, 200)
        self.assertEqual(res_update_role.get_json()["user"]["user_type"], "admin")

        # Revert vanica to user
        client.post("/api/admin/users/role", json={"user_id": "vanica", "user_type": "user"})

        # 3. Add and Delete Tour Package
        res_add_pkg = client.post(
            "/api/admin/packages",
            json={
                "name": "Glamping Ranca Upas Indah",
                "city": "Bandung",
                "category": "Camp",
                "price": 1750000,
                "duration_days": 3,
                "rating": 4.9,
                "highlights": "Penangkaran rusa dan camping asri.",
            }
        )
        self.assertEqual(res_add_pkg.status_code, 200)
        new_pkg_id = res_add_pkg.get_json()["package"]["id"]

        # Delete package
        res_del = client.delete(f"/api/admin/packages/{new_pkg_id}")
        self.assertEqual(res_del.status_code, 200)

        # 4. Bookings overview and status update
        res_b = client.get("/api/admin/bookings")
        self.assertEqual(res_b.status_code, 200)
        bookings = res_b.get_json()["bookings"]
        self.assertGreaterEqual(len(bookings), 1)

        # 5. Matrix Debug & Recalculate
        res_mat = client.get("/api/admin/matrix")
        self.assertEqual(res_mat.status_code, 200)
        mat_data = res_mat.get_json()["matrix"]
        self.assertIn("pairwise_similarities", mat_data)

        # 6. POST /api/admin/recalculate
        res_recalc = client.post("/api/admin/recalculate")
        self.assertEqual(res_recalc.status_code, 200)
        self.assertEqual(res_recalc.get_json()["status"], "ok")


if __name__ == "__main__":
    unittest.main()
