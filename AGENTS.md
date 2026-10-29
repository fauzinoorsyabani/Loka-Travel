# Loka Travel — Hotel Recommendation System

This repository contains the **Hotel & Travel Package Recommendation System** (Content-Based Filtering with Group-Based Room Allocation):
- `hotel_recommender_app.py`: Streamlit interactive dashboard for Basic, Group-Based, and Advanced Group hotel recommendations.
- `app.py` & `templates/index.html`: Flask web application for hotel search and content-based recommendations.
- `hotel_recommender_cli.py`: Command-line interface for generating hotel recommendations.
- `dataset_rekomendasi_hotel.py` & `processed_hotel_data.csv`: Dataset preprocessing and processed hotel catalog.

## Agent skills

### Issue tracker

Issues and specs are tracked as local markdown files under `.scratch/` (or on GitHub at `FauziNs/prototype_03`). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`GLOSSARY.md` at repo root and `docs/adr/`). See `docs/agents/domain.md`.

### Installed Skill Suites (`.agents/skills/` & `.agents/plugins/`)

1. **Matt Pocock Engineering & Productivity Skills** (`mattpocock/skills`):
   - Engineering: `ask-matt`, `code-review`, `codebase-design`, `diagnosing-bugs`, `domain-modeling`, `grill-with-docs`, `implement`, `implement-spec`, `improve-codebase-architecture`, `pr`, `prototype`, `research`, `retro`, `setup-matt-pocock-skills`, `tdd`, `to-spec`, `to-tickets`, `triage`, `wayfinder`, `wizard`
   - Productivity: `grill-me`, `grilling`, `handoff`, `teach`, `to-questionnaire`, `wait-what`, `writing-for-agents`
2. **REA — Reverse Engineer Anything** (`morluto/rea`):
   - Skill: `reverse-engineer-anything` in `.agents/skills/reverse-engineer-anything`
   - MCP Server: `rea` (`npx -y rea-agents@latest --mcp`) configured in `~/.gemini/config/mcp_config.json`
3. **The Designer Skills Pack** (`Owl-Listener/designer-skills`):
   - 9 Plugins & 111 Design Skills installed in `.agents/plugins/`, `.agents/skills/`, and `.gemini/extensions/`: `design-ops`, `design-research`, `design-systems`, `designer-toolkit`, `interaction-design`, `prototyping-testing`, `ui-design`, `ux-strategy`, `visual-critique`
