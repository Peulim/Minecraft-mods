import { AbilityKey, CatalogEntry, CharacterFeature, ChoiceDefinition, ClassEntry, ClassLevel, ContentKind, GameCatalog, Item, Proficiencies, Requirement, SkillKey, Spell, SpellcastingProfile, SubclassEntry } from "@/domain/types";

type Raw = Record<string, unknown>;
export type ImportResult = { catalog: GameCatalog; warnings: string[] };
const records = (value: unknown): Raw[] => Array.isArray(value) ? value.filter((item): item is Raw => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
const text = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const number = (value: unknown) => typeof value === "number" ? value : undefined;
const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const unique = <T,>(items: T[]) => [...new Set(items)];
const emptyProficiencies = (): Proficiencies => ({ armor: [], weapons: [], tools: [], savingThrows: [], skills: [], languages: [] });
const emptyCatalog = (): GameCatalog => ({ version: 2, metadata: { schemaVersion: 2, importedAt: new Date().toISOString(), sourceFormat: "5etools-compatible", counts: {}, presentTypes: [], uninterpreted: [] }, species: [], classes: [], backgrounds: [], feats: [], spells: [], items: [], features: [] });

export const contentId = (kind: ContentKind, name: string, source: string, parent = "") => `${kind}|${name}|${source}|${parent}`.toLowerCase().replace(/[^a-z0-9|]+/g, "-");

function renderEntries(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(renderEntries);
  if (!value || typeof value !== "object") return [];
  const raw = value as Raw;
  const name = text(raw.name);
  const rendered = renderEntries(raw.entries ?? raw.entry ?? raw.items);
  return name ? [`${name}${rendered.length ? `: ${rendered.join(" ")}` : ""}`] : rendered;
}

function requirements(value: unknown): Requirement[] {
  return records(value).flatMap((raw) => {
    const result: Requirement[] = [];
    if (number(raw.level)) result.push({ type: "level", value: number(raw.level) });
    for (const [ability, minimum] of Object.entries((raw.ability as Raw | undefined) ?? {})) result.push({ type: "ability", ability: ability as AbilityKey, minimum: Number(minimum), raw });
    if (raw.spellcasting) result.push({ type: "spellcasting", raw });
    if (!result.length) result.push({ type: "unknown", raw });
    return result;
  });
}

function baseEntry(raw: Raw, kind: ContentKind, parent = ""): CatalogEntry | undefined {
  const name = text(raw.name); if (!name) return undefined;
  const source = text(raw.source, "UNKNOWN"); const entries = renderEntries(raw.entries);
  const id = contentId(kind, name, source, parent); const grants = contentProficiencies(raw, id);
  return { kind, id, name, source, description: entries.join("\n") || "Sem descrição.", traits: entries.slice(0, 8), requirements: requirements(raw.prerequisite), proficiencies: grants.proficiencies, choices: grants.choices, metadata: { raw } };
}

const skillMap: Record<string, SkillKey> = { acrobatics: "acrobatics", animalhandling: "animalHandling", arcana: "arcana", athletics: "athletics", deception: "deception", history: "history", insight: "insight", intimidation: "intimidation", investigation: "investigation", medicine: "medicine", nature: "nature", perception: "perception", performance: "performance", persuasion: "persuasion", religion: "religion", sleightofhand: "sleightOfHand", stealth: "stealth", survival: "survival" };
const skill = (value: string) => skillMap[value.toLowerCase().replace(/[^a-z]/g, "")];
function choicesFrom(value: unknown, type: ChoiceDefinition["type"], source: string): ChoiceDefinition[] {
  return records(value).flatMap((entry, index) => {
    const choose = entry.choose as Raw | undefined; if (!choose) return [];
    const from = strings(choose.from ?? choose.options); const options = type === "skill" ? from.map(skill).filter(Boolean) : from;
    return [{ id: `${source}|${type}|${index}`, type, amount: number(choose.count) ?? 1, options, source }];
  });
}
function explicitChoices(value: unknown, source: string): ChoiceDefinition[] { return records(value).flatMap((entry, index) => { const type = text(entry.type) as ChoiceDefinition["type"]; const allowed = ["skill", "language", "tool", "weapon", "armor", "feat", "spell", "expertise", "subclass", "abilityScore", "equipment"]; if (!allowed.includes(type)) return []; return [{ id: text(entry.id, `${source}|${type}|${index}`), type, amount: number(entry.amount ?? entry.count) ?? 1, options: strings(entry.options ?? entry.from), source, requirements: requirements(entry.requirements) }]; }); }
function contentProficiencies(raw: Raw, source: string) {
  const proficiencies = emptyProficiencies(); const choices: ChoiceDefinition[] = [];
  const definitions: Array<[string, ChoiceDefinition["type"], keyof Proficiencies]> = [["skillProficiencies", "skill", "skills"], ["languageProficiencies", "language", "languages"], ["toolProficiencies", "tool", "tools"], ["weaponProficiencies", "weapon", "weapons"], ["armorProficiencies", "armor", "armor"]];
  for (const [field, type, target] of definitions) records(raw[field]).forEach((entry, index) => { const granted = Object.entries(entry).filter(([key, value]) => key !== "choose" && value === true).map(([key]) => type === "skill" ? skill(key) : key).filter(Boolean) as never[]; (proficiencies[target] as unknown[]).push(...granted); const choose = entry.choose as Raw | undefined; if (choose) { const options = strings(choose.from ?? choose.options).map((value) => type === "skill" ? skill(value) : value).filter(Boolean); choices.push({ id: `${source}|${type}|${index}`, type, amount: number(choose.count) ?? 1, options, source }); } });
  return { proficiencies, choices };
}
function startingProficiencies(raw: Raw, source: string) {
  const start = (raw.startingProficiencies as Raw | undefined) ?? {};
  const proficiency = emptyProficiencies();
  proficiency.armor = strings(start.armor); proficiency.weapons = strings(start.weapons); proficiency.tools = strings(start.tools);
  proficiency.savingThrows = strings(raw.proficiency).filter((value): value is AbilityKey => ["str", "dex", "con", "int", "wis", "cha"].includes(value));
  const skillEntries = Array.isArray(start.skills) ? start.skills : [];
  proficiency.skills = unique(skillEntries.flatMap((entry) => typeof entry === "string" ? [skill(entry)].filter(Boolean) : []));
  return { proficiency, choices: choicesFrom(skillEntries, "skill", source) };
}

function featureReference(value: unknown, kind: "feature" = "feature") {
  const raw = typeof value === "string" ? value : value && typeof value === "object" ? text((value as Raw).classFeature ?? (value as Raw).subclassFeature) : "";
  const parts = raw.split("|"); const name = parts[0] || "Unknown"; const className = parts[1] || ""; const source = (parts.length >= 6 ? parts[4] : parts[2]) || "UNKNOWN"; const level = (parts.length >= 6 ? parts[5] : parts[3]) || "1";
  return { id: contentId(kind, name, source || "UNKNOWN", `${className}|${level}`), name, className, source: source || "UNKNOWN", level: Number(level) || 1, raw };
}
function progression(refs: unknown, tableGroups?: unknown): ClassLevel[] {
  const byLevel = new Map<number, ClassLevel>();
  for (const value of Array.isArray(refs) ? refs : []) { const ref = featureReference(value); const level = byLevel.get(ref.level) ?? { level: ref.level, featureIds: [], choices: [], resources: {} }; level.featureIds.push(ref.id); byLevel.set(ref.level, level); }
  for (const group of records(tableGroups)) { const labels = strings(group.colLabels); if (!Array.isArray(group.rows)) continue; (group.rows as unknown[]).forEach((row, index) => { if (!Array.isArray(row)) return; const level = byLevel.get(index + 1) ?? { level: index + 1, featureIds: [], choices: [], resources: {} }; labels.forEach((label, column) => { const value = row[column]; if (typeof value === "number" || typeof value === "string") level.resources[label] = value; }); byLevel.set(index + 1, level); }); }
  return [...byLevel.values()].sort((a, b) => a.level - b.level);
}
function spellcasting(raw: Raw, uninterpreted: GameCatalog["metadata"]["uninterpreted"]): SpellcastingProfile | undefined {
  if (!raw.casterProgression && !raw.spellcastingAbility) return undefined;
  const progressionValue = text(raw.casterProgression, "unknown");
  const supported = ["full", "half", "third", "pact", "artificer"].includes(progressionValue) ? progressionValue as SpellcastingProfile["progression"] : "unknown";
  if (supported === "unknown") uninterpreted.push({ path: `class.${text(raw.name)}.casterProgression`, reason: `Progressão não reconhecida: ${progressionValue}` });
  const table = records(raw.classTableGroups).find((group) => strings(group.colLabels).some((label) => label.includes("{@filter Spell Slots")));
  const slots = Array.isArray(table?.rows) ? (table.rows as unknown[]).map((row) => Array.isArray(row) ? row.map((cell) => typeof cell === "number" ? cell : 0) : []) : [];
  return { ability: text(raw.spellcastingAbility) as AbilityKey || undefined, progression: supported, model: raw.preparedSpells ? "prepared" : raw.spellsKnownProgression ? "known" : "unknown", cantripsByLevel: (raw.cantripProgression as number[] | undefined) ?? [], spellsKnownByLevel: (raw.spellsKnownProgression as number[] | undefined) ?? [], slotsByLevel: slots, maxSpellLevelByLevel: slots.map((row) => row.reduce((max, count, index) => count > 0 ? index + 1 : max, 0)), metadata: { preparedSpells: raw.preparedSpells, rawTable: table } };
}

function normalizeClass(raw: Raw, subclasses: Raw[], uninterpreted: GameCatalog["metadata"]["uninterpreted"]): ClassEntry | undefined {
  const base = baseEntry(raw, "class"); if (!base) return undefined; const start = startingProficiencies(raw, base.id); const classProgression = progression(raw.classFeatures, raw.classTableGroups);
  start.choices.filter((choice) => !choice.options.length).forEach((choice) => uninterpreted.push({ path: `${base.id}.choices.${choice.id}`, reason: "Escolha usa filtro ou opções não enumeráveis; preservada em metadata.raw." }));
  if (records(raw.classTableGroups).some((group) => Array.isArray(group.rows) && (group.rows as unknown[][]).some((row) => row.some((cell) => typeof cell === "object" && cell !== null)))) uninterpreted.push({ path: `${base.id}.classTableGroups`, reason: "Algumas células de tabela são expressões estruturadas; os valores brutos foram preservados." });
  const subclassLevel = classProgression.find((level) => (Array.isArray(raw.classFeatures) ? raw.classFeatures : []).some((ref) => featureReference(ref).level === level.level && /subclass|archetype|tradition|college|domain/i.test(featureReference(ref).name)))?.level;
  const normalizedSubclasses = subclasses.filter((sub) => text(sub.className) === base.name && text(sub.classSource, base.source) === base.source).map((sub) => normalizeSubclass(sub, base.id)).filter((entry): entry is SubclassEntry => Boolean(entry));
  return { ...base, kind: "class", hitDie: number((raw.hd as Raw | undefined)?.faces) ?? 8, subclassLevel, subclasses: normalizedSubclasses, progression: classProgression, proficiencies: start.proficiency, proficiencyChoices: start.choices.flatMap((choice) => choice.options), choices: start.choices, spellcasting: spellcasting(raw, uninterpreted) };
}
function normalizeSubclass(raw: Raw, classId: string): SubclassEntry | undefined { const base = baseEntry(raw, "subclass", classId); return base ? { ...base, kind: "subclass", classId, progression: progression(raw.subclassFeatures) } : undefined; }
function normalizeFeature(raw: Raw, subclass = false): CharacterFeature | undefined { const name = text(raw.name); if (!name) return undefined; const source = text(raw.source, "UNKNOWN"); const className = text(raw.className); const level = number(raw.level) ?? 1; const parent = `${className}|${level}`; const id = contentId("feature", name, source, parent); return { id, name, source, level, classId: className ? contentId("class", className, text(raw.classSource, source)) : undefined, subclassId: subclass ? contentId("subclass", text(raw.subclassShortName), text(raw.subclassSource, source), contentId("class", className, text(raw.classSource, source))) : undefined, description: renderEntries(raw.entries).join("\n"), requirements: requirements(raw.prerequisite), choices: explicitChoices(raw.choices, id), metadata: { raw } }; }

function normalizeItem(raw: Raw): Item | undefined { const name = text(raw.name); if (!name) return undefined; const source = text(raw.source, "UNKNOWN"); const typeCode = text(raw.type).toUpperCase(); const type: Item["type"] = ["M", "R"].includes(typeCode) ? "weapon" : ["LA", "MA", "HA"].includes(typeCode) ? "armor" : typeCode === "S" ? "shield" : typeCode.includes("TOOL") ? "tool" : "gear"; const propertyNames: Record<string, string> = { F: "finesse", A: "ammunition", LD: "loading", H: "heavy", L: "light", R: "reach", T: "thrown", V: "versatile", "2H": "two-handed" }; return { id: contentId("item", name, source), name, source, type, description: renderEntries(raw.entries).join("\n"), weight: number(raw.weight), value: text(raw.value) || undefined, properties: strings(raw.property).map((value) => propertyNames[value] ?? value), damage: text(raw.dmg1) || undefined, damageSecondary: text(raw.dmg2) || undefined, damageType: text(raw.dmgType) || undefined, range: text(raw.range) || undefined, armorCategory: ({ LA: "light", MA: "medium", HA: "heavy", S: "shield" } as const)[typeCode as "LA"], armorClass: number(raw.ac), dexterityCap: typeCode === "MA" ? 2 : typeCode === "HA" ? 0 : undefined, bonus: number(raw.bonusAc), requirements: requirements(raw.req), metadata: { raw } }; }
function normalizeSpell(raw: Raw): Spell | undefined { const name = text(raw.name); if (!name) return undefined; const source = text(raw.source, "UNKNOWN"); const components = (raw.components as Raw | undefined) ?? {}; const classBlock = (raw.classes as Raw | undefined) ?? {}; const time = records(raw.time).map((entry) => `${number(entry.number) ?? ""} ${text(entry.unit)}`.trim()).join(", "); const range = raw.range as Raw | undefined; const distance = range?.distance as Raw | undefined; const duration = records(raw.duration).map((entry) => { const amount = entry.duration as Raw | undefined; return [entry.concentration ? "Concentration" : "", amount?.amount, amount?.type, entry.type].filter(Boolean).join(" "); }).join(", "); const material = components.m && typeof components.m === "object" ? text((components.m as Raw).text) : typeof components.m === "string" ? components.m : ""; return { id: contentId("spell", name, source), name, source, level: number(raw.level) ?? 0, school: text(raw.school, "Unknown"), castingTime: time || "—", range: distance ? `${distance.amount ?? ""} ${text(distance.type)}`.trim() : text(range?.type, "—"), components: [components.v ? "V" : "", components.s ? "S" : "", components.m ? `M${material ? ` (${material})` : ""}` : ""].filter(Boolean), duration: duration || "—", concentration: records(raw.duration).some((entry) => Boolean(entry.concentration)), ritual: Boolean((raw.meta as Raw | undefined)?.ritual), description: renderEntries(raw.entries).join("\n"), classes: records(classBlock.fromClassList).map((entry) => text(entry.name)).filter(Boolean), metadata: { raw } }; }

export function normalizeFiveEToolsJson(value: unknown): ImportResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("O arquivo JSON precisa conter um objeto de dados.");
  const raw = value as Raw; const catalog = emptyCatalog(); const warnings: string[] = []; const subclasses = records(raw.subclass);
  catalog.species = [...records(raw.race), ...records(raw.species)].map((item) => baseEntry(item, "species")).filter((entry): entry is CatalogEntry => Boolean(entry));
  catalog.classes = records(raw.class).map((item) => normalizeClass(item, subclasses, catalog.metadata.uninterpreted)).filter((entry): entry is ClassEntry => Boolean(entry));
  catalog.backgrounds = records(raw.background).map((item) => baseEntry(item, "background")).filter((entry): entry is CatalogEntry => Boolean(entry));
  catalog.feats = records(raw.feat).map((item) => baseEntry(item, "feat")).filter((entry): entry is CatalogEntry => Boolean(entry));
  catalog.items = records(raw.item).map(normalizeItem).filter((entry): entry is Item => Boolean(entry)); catalog.spells = records(raw.spell).map(normalizeSpell).filter((entry): entry is Spell => Boolean(entry));
  catalog.features = [...records(raw.classFeature).map((entry) => normalizeFeature(entry)), ...records(raw.subclassFeature).map((entry) => normalizeFeature(entry, true))].filter((entry): entry is CharacterFeature => Boolean(entry));
  const recognized = new Set(["_meta", "race", "species", "class", "subclass", "background", "feat", "item", "spell", "classFeature", "subclassFeature"]);
  Object.keys(raw).filter((key) => !recognized.has(key)).forEach((key) => catalog.metadata.uninterpreted.push({ path: key, reason: "Tipo de conteúdo preservado apenas no arquivo de origem; ainda não normalizado." }));
  catalog.metadata.presentTypes = Object.keys(raw).filter((key) => Array.isArray(raw[key]) && (raw[key] as unknown[]).length > 0); catalog.metadata.counts = Object.fromEntries(catalog.metadata.presentTypes.map((key) => [key, (raw[key] as unknown[]).length]));
  if (![catalog.species, catalog.classes, catalog.backgrounds, catalog.feats, catalog.items, catalog.spells, catalog.features].some((list) => list.length)) throw new Error("Nenhuma entrada suportada foi encontrada.");
  if (catalog.metadata.uninterpreted.length) warnings.push(`${catalog.metadata.uninterpreted.length} estruturas não interpretadas foram registradas nos metadados.`);
  return { catalog, warnings };
}

export function mergeCatalog(current: GameCatalog, incoming: GameCatalog): GameCatalog {
  const merge = <T extends { id: string }>(left: T[], right: T[]) => Array.from(new Map([...left, ...right].map((entry) => [entry.id, entry])).values());
  const classMap = new Map(current.classes.map((entry) => [entry.id, entry]));
  for (const next of incoming.classes) { const previous = classMap.get(next.id); if (!previous) { classMap.set(next.id, next); continue; } const levelMap = new Map(previous.progression.map((level) => [level.level, level])); for (const level of next.progression) { const old = levelMap.get(level.level); levelMap.set(level.level, old ? { ...old, featureIds: unique([...old.featureIds, ...level.featureIds]), choices: merge(old.choices, level.choices), resources: { ...old.resources, ...level.resources } } : level); } classMap.set(next.id, { ...previous, ...next, subclasses: merge(previous.subclasses, next.subclasses), progression: [...levelMap.values()].sort((a, b) => a.level - b.level), choices: merge(previous.choices, next.choices), proficiencies: { armor: unique([...previous.proficiencies.armor, ...next.proficiencies.armor]), weapons: unique([...previous.proficiencies.weapons, ...next.proficiencies.weapons]), tools: unique([...previous.proficiencies.tools, ...next.proficiencies.tools]), savingThrows: unique([...previous.proficiencies.savingThrows, ...next.proficiencies.savingThrows]), skills: unique([...previous.proficiencies.skills, ...next.proficiencies.skills]), languages: unique([...previous.proficiencies.languages, ...next.proficiencies.languages]) } }); }
  const result = { ...incoming, species: merge(current.species, incoming.species), classes: [...classMap.values()], backgrounds: merge(current.backgrounds, incoming.backgrounds), feats: merge(current.feats, incoming.feats), spells: merge(current.spells, incoming.spells), items: merge(current.items, incoming.items), features: merge(current.features, incoming.features) };
  result.metadata = { ...incoming.metadata, uninterpreted: [...current.metadata.uninterpreted, ...incoming.metadata.uninterpreted], presentTypes: unique([...current.metadata.presentTypes, ...incoming.metadata.presentTypes]), counts: { species: result.species.length, classes: result.classes.length, backgrounds: result.backgrounds.length, feats: result.feats.length, spells: result.spells.length, items: result.items.length, features: result.features.length } };
  return result;
}
