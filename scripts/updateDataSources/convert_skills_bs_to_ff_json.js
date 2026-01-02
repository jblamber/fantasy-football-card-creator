#!/usr/bin/env node
/**
 * Convert BattleScribe Blood Bowl game system .gst skills into src/card/data/skills.json
 *
 * Input (default):
 *   scripts/updateDataSources/bloodbowl-third-season/bloodbowl-S3.gst
 * Or pass a path to a .gst file as the first CLI arg.
 *
 * Output:
 *   src/card/data/skills.json with the same shape as existing file:
 *   [{ category, name, type, description, restrictions? }]
 *
 * Implementation notes:
 *   - Uses fast-xml-parser to parse XML.
 *   - Categories are taken from sharedSelectionEntryGroups group names (e.g., Agility, General, etc.).
 *   - Each selectionEntry (skill) links via infoLinks -> rule targetId to sharedRules/rule where description lives.
 *   - Skill name taken from <alias> of the rule if available, else from rule name with type suffix removed.
 *   - Type derived from rule name or infoLink name containing "(Active)" or "(Passive)".
 *   - A light heuristic extracts some restriction sentences from descriptions (sentences that include "cannot" or "without the" for common cases),
 *     maintaining current data shape; if none found, restrictions field is omitted.
 */

import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { XMLParser } from 'fast-xml-parser';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function usageAndExit(msg) {
  if (msg) console.error(msg);
  console.error('Usage: node scripts/updateDataSources/convert_skills_bs_to_ff_json.js [path-to-.gst]');
  process.exit(1);
}

// CLI
const arg = process.argv[2];
const gstPath = arg
  ? path.resolve(process.cwd(), arg)
  : path.resolve(__dirname, 'bloodbowl-third-season', 'bloodbowl-S3.gst');

if (!fs.existsSync(gstPath)) {
  usageAndExit(`.gst file not found: ${gstPath}`);
}

const xml = fs.readFileSync(gstPath, 'utf8');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  trimValues: true,
  isArray: (name) => name === 'selectionEntryGroup' || name === 'selectionEntry' || name === 'infoLink' || name === 'rule',
});

let doc;
try {
  doc = parser.parse(xml);
} catch (e) {
  usageAndExit(`Failed to parse XML: ${e?.message || e}`);
}

const gs = doc?.gameSystem;
if (!gs) usageAndExit('Invalid .gst file: missing <gameSystem> root element.');

function toArray(x) { return Array.isArray(x) ? x : (x == null ? [] : [x]); }

function textOf(node) {
  if (node == null) return '';
  if (typeof node === 'string') return node.trim();
  if (typeof node === 'number') return String(node);
  if (typeof node === 'object') {
    if (typeof node['#text'] === 'string') return node['#text'].trim();
    const v = node.valueOf?.();
    if (typeof v === 'string') return v.trim();
  }
  return '';
}

// Build rule map by id
const ruleList = toArray(gs?.sharedRules?.rule);
const ruleById = new Map();
for (const r of ruleList) {
  if (!r) continue;
  const id = r['@_id'];
  if (!id) continue;
  const name = r['@_name'] || '';
  const alias = r?.alias ? textOf(r.alias) : '';
  const desc = r?.description ? textOf(r.description) : '';
  ruleById.set(id, { id, name, alias, description: desc });
}

// Traverse selection entry groups to gather skills
const groups = toArray(gs?.sharedSelectionEntryGroups?.selectionEntryGroup);

function normalizeCategoryName(n) {
  if (!n) return '';
  return String(n).trim().toUpperCase();
}

function detectTypeFromName(n) {
  const s = (n || '').toLowerCase();
  if (s.includes('(passive)')) return 'PASSIVE';
  if (s.includes('(active)')) return 'ACTIVE';
  return 'ACTIVE'; // default
}

function stripTypeSuffix(n) {
  if (!n) return '';
  return n.replace(/\s*\((?:Active|Passive)\)\s*$/i, '').trim();
}

function splitDescriptionAndRestrictions(desc) {
  // Heuristic: split into sentences by period. Keep sentences that look like restrictions separate.
  const sentences = String(desc || '').split(/(?<=\.)\s+/).map(s => s.trim()).filter(Boolean);
  const restrictions = [];
  const kept = [];
  for (const s of sentences) {
    const sl = s.toLowerCase();
    const looksRestrictive = /\bcannot\b/.test(sl) || /\bmay not\b/.test(sl) || /\bwithout the\b/.test(sl) || /\bnot allowed\b/.test(sl);
    if (looksRestrictive) restrictions.push(s);
    else kept.push(s);
  }
  const newDesc = kept.join(' ');
  return { description: newDesc || desc || '', restrictions: restrictions.length ? restrictions : undefined };
}

const results = [];

function walkGroup(group, parentCategoryName) {
  if (!group) return;
  const catName = group['@_name'] || parentCategoryName || '';
  const category = normalizeCategoryName(catName);

  // Entries (skills in this category)
  const entries = toArray(group?.selectionEntries?.selectionEntry);
  for (const entry of entries) {
    if (!entry) continue;
    const entryName = entry['@_name'] || '';
    const ilinks = toArray(entry?.infoLinks?.infoLink);
    // find the first rule link
    const ruleLink = ilinks.find(l => (l?.['@_type'] || '').toLowerCase() === 'rule') || ilinks[0];
    if (!ruleLink) continue;
    const targetId = ruleLink['@_targetId'];
    const infoLinkName = ruleLink['@_name'] || '';
    const type = detectTypeFromName(infoLinkName || entryName);

    const rule = targetId ? ruleById.get(targetId) : undefined;
    if (!rule) continue;

    const name = rule.alias ? rule.alias : stripTypeSuffix(rule.name) || entryName;
    const { description, restrictions } = splitDescriptionAndRestrictions(rule.description || '');

    results.push({
      category,
      name,
      type,
      description,
      ...(restrictions ? { restrictions } : {})
    });
  }

  // Child groups
  const childGroups = toArray(group?.selectionEntryGroups?.selectionEntryGroup);
  for (const cg of childGroups) walkGroup(cg, catName);
}

function findUncategorizedRules() {
    ruleById.entries().forEach(([id, rule]) => {
        if (!results.some(exr => exr.name === rule.alias)) {
            results.push({
                category: '',
                name: rule.alias,
                type: detectTypeFromName(rule.name),
                description: rule.description,
            });
        }
    })
}

for (const g of groups) walkGroup(g, '');
findUncategorizedRules();

// Sort results by category then name
results.sort((a, b) => (a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category)));

// Ensure output directory exists and write file
const outFile = path.resolve(__dirname, '..', '..', 'src', 'card', 'data', 'skills.json');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8');

console.log(`Wrote ${results.length} skill definition(s) to ${path.relative(process.cwd(), outFile)} from ${path.relative(process.cwd(), gstPath)}`);
