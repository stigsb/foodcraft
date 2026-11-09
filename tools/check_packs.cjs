// Static cross-reference check of both packs: JSON parses; item icons, lang keys, block placers, geometries,
// bones and states in bone_visibility, textures, loot tables, registered custom components, recipe and loot
// item ids, feature references, and foodcraft:* ids used in scripts all resolve.
// Usage: node tools/check_packs.cjs   (from the repo root). Prints "ALL OK" or one line per problem.
const fs=require("fs"),path=require("path");
const BP="packs/foodcraft_bp",RP="packs/foodcraft_rp";const errs=[];const E=(m)=>errs.push(m);
const walk=(d)=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const J={};for(const f of [...walk(BP),...walk(RP)].filter(f=>f.endsWith(".json"))){try{J[f.split(path.sep).join("/")]=JSON.parse(fs.readFileSync(f,"utf8"))}catch(e){E("parse "+f+": "+e.message)}}
const get=(p)=>J[p];
const items=new Set(),blocks=new Set(),features=new Set();
for(const [f,o] of Object.entries(J)){if(o["minecraft:item"])items.add(o["minecraft:item"].description.identifier);if(o["minecraft:block"])blocks.add(o["minecraft:block"].description.identifier);
 for(const k of Object.keys(o))if(/feature$/.test(k)&&o[k].description)features.add(o[k].description.identifier);}
const known=(id)=>id.startsWith("minecraft:")||items.has(id)||blocks.has(id);
const itemAtlas=get(RP+"/textures/item_texture.json").texture_data, terr=get(RP+"/textures/terrain_texture.json").texture_data;
const geos=new Set();for(const [f,o] of Object.entries(J))for(const g of o["minecraft:geometry"]||[])geos.add(g.description.identifier);
const lang={};for(const l of ["en_US","nb_NO"])lang[l]=new Set(fs.readFileSync(RP+"/texts/"+l+".lang","utf8").split(/\r?\n/).map(x=>x.split("=")[0]));
const png=(t)=>fs.existsSync(RP+"/"+t+".png")||E("missing png "+t);
for(const [k,v] of Object.entries(itemAtlas))png(v.textures);for(const [k,v] of Object.entries(terr))png(typeof v.textures==="string"?v.textures:v.textures[0]);
const blocksJson=get(RP+"/blocks.json");
for(const [f,o] of Object.entries(J)){
 const it=o["minecraft:item"];if(it){const c=it.components;const id=it.description.identifier;
  const t=c["minecraft:icon"]?.textures?.default;if(t&&!itemAtlas[t])E(f+": icon "+t);
  const dn=c["minecraft:display_name"]?.value;for(const l in lang)if(dn&&!lang[l].has(dn))E(f+": lang "+l+" "+dn);
  const bp=c["minecraft:block_placer"];if(bp&&!blocks.has(bp.block))E(f+": placer "+bp.block);}
 const b=o["minecraft:block"];if(b){const id=b.description.identifier;const comps=[b.components,...(b.permutations||[]).map(p=>p.components)];
  if(!blocksJson[id])E("blocks.json missing "+id);for(const l in lang)if(!lang[l].has("tile."+id+".name"))E("lang "+l+" tile "+id);
  for(const c of comps){const g=c["minecraft:geometry"];const gid=typeof g==="string"?g:g?.identifier;if(gid&&!gid.startsWith("minecraft:")&&!geos.has(gid))E(f+": geo "+gid);
   for(const m of Object.values(c["minecraft:material_instances"]||{}))if(m.texture&&!terr[m.texture])E(f+": tex "+m.texture);
   const loot=c["minecraft:loot"];if(loot&&!J[BP+"/"+loot])E(f+": loot "+loot);}
  const vis=b.components["minecraft:geometry"]?.bone_visibility;if(vis){const gid=b.components["minecraft:geometry"].identifier;const gg=Object.values(J).flatMap(o=>o["minecraft:geometry"]||[]).find(g=>g.description.identifier===gid);const names=new Set(gg.bones.map(x=>x.name));for(const n of Object.keys(vis))if(!names.has(n))E(f+": bone "+n);
   const states=b.description.states||{};for(const expr of Object.values(vis))for(const m of String(expr).matchAll(/q\.block_state\('([^']+)'\)\s*[=!<>]+\s*'?([\w]+)'?/g)){if(!states[m[1]])E(f+": state "+m[1]);else if(!states[m[1]].map(String).includes(m[2])&&!/[<>]/.test(expr))E(f+": value "+m[1]+"="+m[2]);}}
  for(const k of Object.keys(b.components))if(k.startsWith("foodcraft:")&&!fs.readFileSync(BP+"/scripts/main.js","utf8").includes('"'+k+'"'))E(f+": component not registered "+k);}
 const r=o["minecraft:recipe_shaped"]||o["minecraft:recipe_shapeless"]||o["minecraft:recipe_furnace"];if(r){const ids=JSON.stringify(r).match(/"item":"([^"]+)"/g)||[];for(const x of ids){const id=x.slice(8,-1);if(!known(id))E(f+": item "+id)}if(o["minecraft:recipe_furnace"]){const out=r.output;if(!known(out))E(f+": out "+out)}}
 if(f.includes("loot_tables"))for(const m of JSON.stringify(o).matchAll(/"name":"([^"]+)"/g))if(!known(m[1]))E(f+": loot item "+m[1]);
 for(const k of Object.keys(o))if(/feature$/.test(k)){const x=o[k];if(x.places_feature&&!features.has(x.places_feature))E(f+": feature "+x.places_feature);if(x.places_block){const pb=x.places_block.name??x.places_block;if(!blocks.has(pb))E(f+": block "+pb);}}
 const fr=o["minecraft:feature_rules"];if(fr&&!features.has(fr.description.places_feature))E(f+": rule feature");
}
// script item ids
for(const f of walk(BP+"/scripts"))for(const m of fs.readFileSync(f,"utf8").matchAll(/"(foodcraft:[a-z_]+)"/g)){const id=m[1];if(!known(id)&&!/foodcraft:(growth|fruit|stage|dish|item|chops|pot|filled|portions|board|scallop_bed|tomato|pineapple|crop|pizza_oven|cutting_board|fish_bucket|berry_bush|illumination_left|illumination_lamp|wild|picked|heart_sapling|heart_flower|heart_tree|cauldron@|board@|raw_pizza_)$/.test(id))E(f+": id "+id);}
console.log("items",items.size,"blocks",blocks.size,"features",features.size,"geos",geos.size);console.log(errs.length?errs.join("\n"):"ALL OK");
