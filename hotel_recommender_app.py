import streamlit as st
import pandas as pd
from loka_recommender import LokaRecommendationEngine

st.set_page_config(
    page_title="Loka Travel AI — Hybrid CF & Group Hotel Recommender",
    page_icon="🧭",
    layout="wide",
    initial_sidebar_state="expanded",
)


@st.cache_resource
def get_engine() -> LokaRecommendationEngine:
    return LokaRecommendationEngine("processed_hotel_data.csv")


engine = get_engine()
benchmarks = engine.get_research_benchmarks()

# Header
st.title("🧭 Loka Travel AI — Hybrid Travel Package & Group Hotel Recommendation System")
st.caption(
    f"Published Journal Research: *{benchmarks['paper_title']}* ({benchmarks['journal']}) · "
    "Authors: Muhammad Edi Iswanto, Andi Nur Rachman, **Fauzi Noorsyabani**"
)

kpi1, kpi2, kpi3, kpi4 = st.columns(4)
kpi1.metric("CF Accuracy (5-Fold)", f"{benchmarks['average_accuracy']}%", f"MAE {benchmarks['average_mae']}")
kpi2.metric("CBF Relevance Score", f"{benchmarks['cbf_relevance_score']}", "TF-IDF 5,000 Features")
kpi3.metric("Verified Hotel Catalog", f"{benchmarks['total_hotels']} Hotels", f"{benchmarks['total_cities']} Cities")
kpi4.metric("Execution Speed", "< 35 ms", "100x faster than 5.28s baseline")

tab_cf, tab_hotel, tab_paper = st.tabs(
    [
        "🏝️ 1. Tour Packages (Collaborative Filtering)",
        "🏨 2. Group Hotel & Room Allocator (Content-Based)",
        "📄 3. Published Research & 5-Fold Benchmarks",
    ]
)

with tab_cf:
    st.subheader("Memory-Based User Collaborative Filtering (UBCF)")
    col_u, col_c = st.columns([2, 2])
    with col_u:
        user_options = {uid: u["name"] for uid, u in engine.users.items()}
        selected_user = st.selectbox(
            "Active Traveler Profile (U₁):",
            options=list(user_options.keys()),
            format_func=lambda k: user_options[k],
        )
    with col_c:
        selected_cat = st.selectbox(
            "Filter Destination Category:",
            ["All", "Taman Hiburan", "Camp", "Mountain", "Beach"],
        )

    cf_result = engine.recommend_collaborative(
        user_id=selected_user, category=selected_cat, top_k=6
    )
    st.info(
        f"**Nearest Neighbor Peer (U₂):** {cf_result['most_similar_user']} · "
        f"**Cosine Similarity cos(U₁, U₂):** `{cf_result['similarity_score']}` · "
        f"**Latency:** `{cf_result['latency_ms']} ms`"
    )

    cols = st.columns(3)
    for idx, pkg in enumerate(cf_result["recommendations"]):
        with cols[idx % 3]:
            st.image(pkg["image"], use_container_width=True)
            st.markdown(f"#### {pkg['name']}")
            st.caption(f"📍 {pkg['location']} · 🏷️ {pkg['category']} · ⭐ {pkg['rating']}")
            st.write(pkg["highlights"])
            st.markdown(
                f"**Price:** Rp {pkg['price']:,} / {pkg['duration_days']} days  \n"
                f"**CF Match:** `{pkg['cf_match_percent']}%` ({', '.join(pkg['endorsed_by'])})"
            )

with tab_hotel:
    st.sidebar.header("🏨 Group Hotel Parameters")
    selected_city = st.sidebar.selectbox("Destination City:", ["All"] + benchmarks["cities"], index=3)
    rec_mode_label = st.sidebar.radio(
        "Recommendation Mode:",
        ["Advanced Group AI", "Group Budget", "Basic TF-IDF"],
    )
    mode_map = {"Advanced Group AI": "advanced", "Group Budget": "group", "Basic TF-IDF": "basic"}

    st.sidebar.subheader("Group Composition")
    adults = st.sidebar.number_input("Adults (Dewasa):", 1, 20, 2)
    children = st.sidebar.number_input("Children (Anak-anak):", 0, 15, 1)
    seniors = st.sidebar.number_input("Seniors (Lansia):", 0, 15, 0)
    budget = st.sidebar.slider("Max Nightly Budget / Room (Rp):", 300000, 10000000, 2500000, step=100000)

    st.sidebar.subheader("Facility Preference Weights (0–1)")
    prefs = {
        "wifi": st.sidebar.slider("WiFi & Business:", 0.0, 1.0, 0.8),
        "pool": st.sidebar.slider("Swimming Pool:", 0.0, 1.0, 0.8),
        "restaurant": st.sidebar.slider("Restaurant & Dining:", 0.0, 1.0, 0.7),
        "kids": st.sidebar.slider("Kids Club & Playground:", 0.0, 1.0, 0.8 if children > 0 else 0.3),
        "accessible": st.sidebar.slider("Senior Accessibility & Spa:", 0.0, 1.0, 0.8 if seniors > 0 else 0.4),
    }
    num_recs = st.sidebar.slider("Number of Recommendations:", 2, 12, 6)

    hotel_res = engine.recommend_hotels(
        city=selected_city,
        mode=mode_map[rec_mode_label],
        adults=adults,
        children=children,
        seniors=seniors,
        budget_per_night=budget,
        preferences=prefs,
        num_recs=num_recs,
    )

    alloc = hotel_res["room_allocation"]
    st.success(
        f"**Room Allocation Strategy ({alloc['total_guests']} Guests → {alloc['total_rooms']} Rooms):** "
        f"{alloc['strategy']} · Anchor Reference: *{hotel_res['reference_hotel']['name']}* ({hotel_res['latency_ms']} ms)"
    )

    for h in hotel_res["hotels"]:
        with st.container():
            c1, c2, c3 = st.columns([2.2, 2.2, 1.3])
            with c1:
                st.subheader(h["name"])
                st.write(f"📍 **{h['region']}** · 🏷️ `{h['category']}`")
                st.write(f"⭐ {'⭐' * int(h['starRating'])} · **{h['userRating']}/10** ({h['numReviews']:,} reviews)")
            with c2:
                st.write("**Top Facilities:** " + ", ".join(h["features"][:6]))
                st.caption(
                    f"TF-IDF Sim: `{h['content_similarity']}` · "
                    f"Pref Score: `{h['preference_score']}` · "
                    f"Demographic Fit: `{h['demographic_score']}`"
                )
            with c3:
                st.metric("Composite Score", f"{h['composite_score']}")
                st.write(f"**Rp {h['price_per_night']:,}** / room / night")
                st.caption(f"Est. Group Total: Rp {h['estimated_group_total_per_night']:,}")
            st.divider()

with tab_paper:
    st.subheader("Published Paper Experimental Results (Tables I & II)")
    st.latex(r"\cos(U_1, U_2) = \frac{\sum_{i=1}^{n} U_{1i} \cdot U_{2i}}{\sqrt{\sum_{i=1}^{n} U_{1i}^2} \cdot \sqrt{\sum_{i=1}^{n} U_{2i}^2}}")
    st.latex(r"\text{MAE} = \frac{1}{n}\sum_{i=1}^{n} |y_{i,\text{pred}} - y_{i,\text{true}}| = 0.9689 \quad \Longrightarrow \quad \text{Accuracy} = \left(\frac{5 - \text{MAE}}{5}\right) \times 100\% = 80.63\%")
    st.dataframe(pd.DataFrame(benchmarks["folds"]), use_container_width=True)
