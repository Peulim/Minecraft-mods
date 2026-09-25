import { CatalogEntry, Character, CharacterFeature, ChoiceDefinition, GameCatalog, PendingChoice, Proficiencies, Requirement, SkillKey, ValidationResult } from "./types";
import { emptyProficiencies, isValidPointBuy, mergeProficiencies } from "./characterRules";
import { calculateArmorClass } from "./inventoryRules";

const aliases: Record<string, SkillKey> = { acrobacia: "acrobatics", arcanismo: "arcana", atletismo: "athletics", enganação: "deception", furtividade: "stealth", história: "history", intimidacao: "intimidation", intimidação: "intimidation", investigação: "investigation", medicina: "medicine", percepção: "perception", religião: "religion", sobrevivência: "survival", intuição: "insight" };
const asSkill = (name: string) => aliases[name.toLocaleLowerCase()] ?? (name as SkillKey);
const entryFeatures = (entry: CatalogEntry | undefined, level = 1): CharacterFeature[] => (entry?.traits ?? []).map((name) => ({ id: `feature|${entry?.id}|${name}`, name, description: entry?.description ?? "", source: entry?.source ?? "Unknown", level }));
const uniqueFeatures = (features: CharacterFeature[]) => [...new Map(features.map((feature) => [feature.id, feature])).values()];

function pending(definition: ChoiceDefinition, character: Character): PendingChoice {
  const selected = character.choiceSelections[definition.id] ?? [];
  return { ...definition, selected, required: true, status: selected.length === definition.amount && selected.every((value) => definition.options.includes(value)) ? "resolved" : "pending" };
}
function eligibleFeature(feature: CharacterFeature, character: Character) { return feature.level <= character.level && (!feature.classId || feature.classId === character.classId) && (!feature.subclassId || feature.subclassId === character.subclassId); }

export function checkRequirements(requirements: Requirement[] | undefined, character: Character): { met: boolean; unverifiable: boolean } {
  let unverifiable = false;
  const met = (requirements ?? []).every((requirement) => {
    if (requirement.type === "level") return character.level >= Number(requirement.value);
    if (requirement.type === "ability" && requirement.ability && requirement.minimum) return character.abilities[requirement.ability] >= requirement.minimum;
    if (requirement.type === "spellcasting") return Boolean(character.spells.spellcastingAbility);
    unverifiable = true; return true;
  });
  return { met, unverifiable };
}

export function buildCharacterState(character: Character, catalog: GameCatalog): Pick<Character, "features" | "pendingChoices" | "proficiencies" | "resources" | "spells"> {
  const species = catalog.species.find((entry) => entry.id === character.speciesId); const klass = catalog.classes.find((entry) => entry.id === character.classId); const background = catalog.backgrounds.find((entry) => entry.id === character.backgroundId); const subclass = klass?.subclasses.find((entry) => entry.id === character.subclassId);
  const progressionFeatureIds = new Set([...(klass?.progression.filter((level) => level.level <= character.level).flatMap((level) => level.featureIds) ?? []), ...(subclass?.progression.filter((level) => level.level <= character.level).flatMap((level) => level.featureIds) ?? [])]);
  const featureChoices = catalog.features.filter((feature) => progressionFeatureIds.has(feature.id)).flatMap((feature) => feature.choices ?? []);
  const choiceDefinitions = [...(species?.choices ?? []), ...(background?.choices ?? []), ...(klass?.choices ?? []), ...(klass?.progression.filter((level) => level.level <= character.level).flatMap((level) => level.choices) ?? []), ...(subclass?.progression.filter((level) => level.level <= character.level).flatMap((level) => level.choices) ?? []), ...featureChoices];
  const choices = choiceDefinitions.map((choice) => pending(choice, character));
  if (klass?.subclasses.length && klass.subclassLevel && character.level >= klass.subclassLevel && !subclass) choices.push(pending({ id: `${klass.id}|subclass`, type: "subclass", amount: 1, options: klass.subclasses.map((entry) => entry.id), source: klass.id }, character));
  const selectedSkills = [...character.selectedProficiencies, ...choices.filter((choice) => choice.type === "skill").flatMap((choice) => choice.selected)].map(asSkill);
  const proficiencies = mergeProficiencies(species?.proficiencies ?? emptyProficiencies(), background?.proficiencies ?? emptyProficiencies(), klass?.proficiencies ?? emptyProficiencies(), { ...emptyProficiencies(), skills: selectedSkills, languages: choices.filter((choice) => choice.type === "language").flatMap((choice) => choice.selected), tools: choices.filter((choice) => choice.type === "tool").flatMap((choice) => choice.selected), weapons: choices.filter((choice) => choice.type === "weapon").flatMap((choice) => choice.selected), armor: choices.filter((choice) => choice.type === "armor").flatMap((choice) => choice.selected) });
  const features = uniqueFeatures([...entryFeatures(species), ...entryFeatures(background), ...catalog.features.filter((feature) => progressionFeatureIds.has(feature.id) || eligibleFeature(feature, character))]);
  const hitDie = klass?.hitDie ?? 8; const hitPoints = Math.max(1, hitDie + Math.floor((character.level - 1) * (hitDie / 2 + 1)));
  const profile = klass?.spellcasting; const slotsAtLevel = profile?.slotsByLevel[character.level - 1] ?? [];
  return { features, pendingChoices: choices, proficiencies, spells: { ...character.spells, spellcastingAbility: profile?.ability, slots: Object.fromEntries(slotsAtLevel.map((count, index) => [index + 1, count])) }, resources: { ...character.resources, armorClass: calculateArmorClass(character, catalog.items), hitPoints: { maximum: hitPoints, current: Math.min(character.resources.hitPoints?.current ?? hitPoints, hitPoints) } } };
}

export const rebuildCharacter = (character: Character, catalog: GameCatalog): Character => ({ ...character, ...buildCharacterState(character, catalog) });

export function isSpellAvailable(character: Character, spellId: string, catalog: GameCatalog): boolean {
  const spell = catalog.spells.find((entry) => entry.id === spellId); const klass = catalog.classes.find((entry) => entry.id === character.classId); if (!spell || !klass?.spellcasting) return false;
  if (spell.classes.length && !spell.classes.some((name) => name.toLowerCase() === klass.name.toLowerCase())) return false;
  return spell.level <= (klass.spellcasting.maxSpellLevelByLevel[character.level - 1] ?? 0);
}

export function validateCharacter(character: Character, catalog: GameCatalog): ValidationResult {
  const rebuilt = rebuildCharacter(character, catalog); const errors: string[] = []; const warnings: string[] = [];
  if (!character.identity.name.trim()) errors.push("Nome obrigatório."); if (!character.speciesId) errors.push("Espécie não selecionada."); else if (!catalog.species.some((entry) => entry.id === character.speciesId)) errors.push("Espécie não existe no catálogo atual."); if (!character.classId) errors.push("Classe não selecionada."); else if (!catalog.classes.some((entry) => entry.id === character.classId)) errors.push("Classe não existe no catálogo atual."); if (!character.backgroundId) errors.push("Background não selecionado."); if (!isValidPointBuy(character.abilities)) errors.push("Distribuição de atributos inválida.");
  if (rebuilt.pendingChoices.some((choice) => choice.status === "pending" && choice.required)) errors.push("Há escolhas obrigatórias não resolvidas.");
  for (const featId of character.feats) { const feat = catalog.feats.find((entry) => entry.id === featId); if (!feat) warnings.push(`Feat ausente do catálogo: ${featId}.`); else { const result = checkRequirements(feat.requirements, character); if (!result.met) errors.push(`Requisitos não atendidos para ${feat.name}.`); if (result.unverifiable) warnings.push(`Requisito de ${feat.name} não verificável automaticamente.`); } }
  character.inventory.filter((entry) => !catalog.items.some((item) => item.id === entry.itemId)).forEach((entry) => warnings.push(`Item ausente do catálogo: ${entry.itemId}.`)); [...character.spells.cantrips, ...character.spells.known, ...character.spells.prepared].filter((id) => !isSpellAvailable(character, id, catalog)).forEach((id) => warnings.push(`Magia incompatível ou não verificável: ${id}.`));
  if (catalog.metadata.uninterpreted.length) warnings.push(`${catalog.metadata.uninterpreted.length} estruturas do catálogo ainda não foram interpretadas.`); if (catalog.classes.find((entry) => entry.id === character.classId)?.spellcasting?.progression === "unknown") warnings.push("Spellcasting incompleto para esta classe.");
  return { valid: errors.length === 0, errors, warnings };
}
