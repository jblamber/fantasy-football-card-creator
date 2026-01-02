Uses the battlescribe data as a source for players and rules.

    git clone https://github.com/BSData/bloodbowl-third-season.git

Setup (one-time):
- Install deps at repo root (preferred) or in this subfolder.

At repo root:

    npm install

Or inside this folder only:

    cd scripts/updateDataSources
    npm install

Conversion script:
- Converts a BattleScribe `.cat` team file into a JSON list of player presets for the Card Creator.
- Now uses `fast-xml-parser` for robust XML parsing (no regex scraping).

Usage from project root:

    node scripts/updateDataSources/convert_team_bs_to_ff_json.js Vampires
    # or
    node scripts/updateDataSources/convert_team_bs_to_ff_json.js scripts/updateDataSources/bloodbowl-third-season/Snotling.cat

Output:

    src/card/data/<Team>.json
    


Additional conversion script (skills):
- Converts the Blood Bowl game system `.gst` into `src/card/data/skills.json`.
- Uses `fast-xml-parser` to follow `sharedSelectionEntryGroups` → `infoLinks` → `sharedRules`.

Usage from project root:

    node scripts/updateDataSources/convert_skills_bs_to_ff_json.js
    # or with explicit path
    node scripts/updateDataSources/convert_skills_bs_to_ff_json.js scripts/updateDataSources/bloodbowl-third-season/bloodbowl-S3.gst

Output:

    src/card/data/skills.json
