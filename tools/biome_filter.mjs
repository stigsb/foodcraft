// Biome filters for spawn rules and feature rules, which can only test biome tags, not biome ids.
// biomeFilter([ids]) finds tag tests that match exactly those biomes (checked against every vanilla biome in
// tools/data/biome_tags.json) and throws if it cannot.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TAGS = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/data/biome_tags.json"), "utf8"));
delete TAGS["//"];
const ALL = Object.keys(TAGS);
const has = (b, lit) => TAGS[b].includes(lit.tag) === lit.is;

export function biomeFilter(wanted) {
  const want = new Set(wanted);
  const others = ALL.filter((b) => !want.has(b));
  const groups = [];
  let uncovered = [...want];
  while (uncovered.length) {
    const seed = uncovered[0];
    const lits = [];
    let bad = others, good = uncovered;
    while (bad.length) {
      // Candidate tests that the seed biome passes; pick the one that drops the most unwanted biomes,
      // breaking ties by keeping the most still-uncovered wanted biomes.
      const cands = [...new Set(ALL.flatMap((b) => TAGS[b]))].flatMap((tag) => [{ tag, is: true }, { tag, is: false }]).filter((l) => has(seed, l));
      let best, bestScore = -1;
      for (const l of cands) {
        const dropped = bad.filter((b) => !has(b, l)).length;
        if (!dropped) continue;
        const score = dropped * 1000 + good.filter((b) => has(b, l)).length;
        if (score > bestScore) [best, bestScore] = [l, score];
      }
      if (!best) throw new Error(`cannot separate ${seed} from ${bad.join(" ")}`);
      lits.push(best);
      bad = bad.filter((b) => has(b, best));
      good = good.filter((b) => has(b, best));
    }
    groups.push(lits);
    uncovered = uncovered.filter((b) => !lits.every((l) => has(b, l)));
  }
  // verify
  for (const b of ALL) {
    const hit = groups.some((g) => g.every((l) => has(b, l)));
    if (hit !== want.has(b)) throw new Error(`biome filter wrong for ${b}`);
  }
  const test = (l) => ({ test: "has_biome_tag", operator: l.is ? "==" : "!=", value: l.tag });
  return { any_of: groups.map((g) => ({ all_of: g.map(test) })) };
}

