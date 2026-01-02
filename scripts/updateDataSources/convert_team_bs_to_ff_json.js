#!/usr/bin/env node
/**
 * Convert a BattleScribe team .cat file into a simple JSON list of player presets
 * for the Card Creator form.
 *
 * Usage:
 *   node scripts/updateDataSources/convert_team_bs_to_ff_json.js Vampires
 *   node scripts/updateDataSources/convert_team_bs_to_ff_json.js Snotling.cat
 *
 * Input:
 *   scripts/updateDataSources/bloodbowl-third-season/<Team>.cat
 *
 * Output:
 *   src/card/data/<Team>.json  (array of FantasyFootballPlayerData-like objects)
 *
 * Implementation notes:
 *   Uses fast-xml-parser for robust XML parsing (no regex scraping).
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { XMLParser } from 'fast-xml-parser';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function usageAndExit(msg) {
  if (msg) console.error(msg);
  console.error('Usage: node scripts/updateDataSources/convert_team_bs_to_ff_json.js <TeamName|path-to-.cat>');
  process.exit(1);
}

// CLI args
const arg = process.argv[2];
if (!arg) usageAndExit('Missing team name or .cat path.');

const isCatPath = /\.cat$/i.test(arg);
const catFilename = isCatPath ? path.basename(arg) : `${arg}.cat`;
const catDir = isCatPath
  ? path.resolve(process.cwd(), path.dirname(arg))
  : path.resolve(__dirname, 'updateDataSources', 'bloodbowl-third-season');
const catPath = path.resolve(catDir, catFilename);

if (!fs.existsSync(catPath)) {
  usageAndExit(`.cat file not found: ${catPath}`);
}

const xml = fs.readFileSync(catPath, 'utf8');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  trimValues: true,
  isArray: (name, jpath) => {
    // Force arrays for these nodes to simplify downstream logic
    return name === 'profile' || name === 'characteristic';
  }
});

let doc;
try {
  doc = parser.parse(xml);
} catch (e) {
  usageAndExit(`Failed to parse XML: ${e?.message || e}`);
}

const catalogue = doc?.catalogue;
if (!catalogue) usageAndExit('Invalid .cat file: missing <catalogue> root element.');

const teamName = catalogue['@_name'] || path.basename(catFilename, '.cat');

function toArray(x) {
  return Array.isArray(x) ? x : (x == null ? [] : [x]);
}

const positionRegex = /lineman|blitzer|catcher|big guy|blocker|thrower/i;

function textOf(node) {
  // fast-xml-parser returns text content directly unless there are attributes,
  // in which case text may be under '#text'. Handle both.
  if (node == null) return '';
  if (typeof node === 'string') return node.trim();
  if (typeof node === 'number') return String(node);
  if (typeof node === 'object') {
    if (typeof node['#text'] === 'string') return node['#text'].trim();
    if (typeof node['#text'] === 'number') return String(node['#text'])
    // Some BS data places the text directly when attributes exist; try valueOf
    const v = node.valueOf?.();
    if (typeof v === 'string') return v.trim();
  }
  return '';
}

function buildCharMap(profile) {
  const map = new Map();
  const chars = toArray(profile?.characteristics?.characteristic);
  for (const c of chars) {
    const name = c?.['@_name']?.trim();
    if (!name) continue;
    const value = textOf(c);
    map.set(name, value);
  }
  return map;
}

function findPlayerProfiles(root) {
  // Prefer sharedProfiles if present
  const shared = toArray(root?.sharedProfiles?.profile).filter(p => p?.['@_typeName'] === 'Player');
  if (shared.length) return shared;

  // Fallback: search entire tree for any profile with typeName='Player'
  const found = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (k === 'profile') {
        const arr = toArray(v);
        for (const p of arr) {
          if (p && typeof p === 'object' && p['@_typeName'] === 'Player') found.push(p);
        }
      }
      if (v && typeof v === 'object') walk(v);
    }
  }
  walk(root);
  return found;
}

const playerProfiles = findPlayerProfiles(catalogue);

const presets = [];
for (const p of playerProfiles) {
  const profileName = p?.['@_name'] || '';
  const charMap = buildCharMap(p);
  const getChar = (n) => (charMap.get(n) || '').trim();

  const ma = getChar('MA');
  const st = getChar('ST');
  const ag = getChar('AG');
  const pa = getChar('PA');
  const av = getChar('AV');
  const skillsAndTraits = getChar('Skills & Traits');
  const primary = getChar('Primary');
  const secondary = getChar('Secondary');
  const cost = getChar('Cost');
  const keywordsRaw = getChar('Keywords');

  let positionName = profileName;
  if (keywordsRaw) {
    const boldTokens = Array.from(keywordsRaw.matchAll(/\*\*([^*]+)\*\*/g)).map(x => x[1].trim());
    if (boldTokens.length) {
      const teamLower = teamName.toLowerCase();
      const filtered = boldTokens.filter(t => {
        const tl = t.toLowerCase();
        return tl !== 'special' && tl !== 'big guy' && tl !== teamLower;
      });
      const position = filtered.find(t => t.toLowerCase().match(positionRegex));
      if (filtered[0]) positionName = position;
    }
  }

  const footer = keywordsRaw ? keywordsRaw.replace(/\*\*/g, '') : '';

  presets.push({
    ag: ag || '',
    av: av || '',
    ma: ma || '',
    pa: pa || '',
    st: st || '',
    playerType: 'normal',
    teamName: teamName || '',
    cost: cost || '',
    cardName: profileName || '',
    skillsAndTraits: skillsAndTraits || '',
    positionName: positionName || '',
    primary: primary || '',
    secondary: secondary || '',
    footer: footer || '',
    notes: ''
  });
}

if (!presets.length) {
  console.warn('No player profiles found. Nothing to write.');
}

// Ensure output directory exists
const outDir = path.resolve(__dirname, '..', '..', 'src', 'card', 'data');
fs.mkdirSync(outDir, { recursive: true });

const outFile = path.resolve(outDir, `${path.basename(catFilename, '.cat').replace(" ","_")}.json`);
fs.writeFileSync(outFile, JSON.stringify(presets, null, 2), 'utf8');

console.log(`Wrote ${presets.length} player preset(s) to ${path.relative(process.cwd(), outFile)}`);
