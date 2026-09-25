import { AbilityKey, Character, Proficiencies, SkillKey, abilityKeys, skillAbilities } from "./types";

export const createDraft = (): Character => ({
  id: `character-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, identity: { name: "" }, level: 1, experience: 0,
  abilities: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }, proficiencies: { armor: [], weapons: [], tools: [], savingThrows: [], skills: [], languages: [] }, expertise: [], selectedProficiencies: [], choiceSelections: {}, features: [], pendingChoices: [], inventory: [], spells: { cantrips: [], known: [], prepared: [], slots: {} }, feats: [], resources: {},
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
});
export const pointCost = (score: number) => score <= 13 ? score - 8 : 5 + (score - 13) * 2;
export const pointsSpent = (abilities: Record<AbilityKey, number>) => abilityKeys.reduce((total, key) => total + pointCost(abilities[key]), 0);
export const pointsRemaining = (abilities: Record<AbilityKey, number>) => 27 - pointsSpent(abilities);
export const isValidPointBuy = (abilities: Record<AbilityKey, number>) => abilityKeys.every((key) => abilities[key] >= 8 && abilities[key] <= 15) && pointsSpent(abilities) <= 27;
export const abilityModifier = (score: number) => Math.floor((score - 10) / 2);
export const proficiencyBonus = (level: number) => 2 + Math.floor((Math.min(20, Math.max(1, level)) - 1) / 4);
export const emptyProficiencies = (): Proficiencies => ({ armor: [], weapons: [], tools: [], savingThrows: [], skills: [], languages: [] });
export const mergeProficiencies = (...all: Proficiencies[]): Proficiencies => ({ armor: [...new Set(all.flatMap((value) => value.armor))], weapons: [...new Set(all.flatMap((value) => value.weapons))], tools: [...new Set(all.flatMap((value) => value.tools))], savingThrows: [...new Set(all.flatMap((value) => value.savingThrows))], skills: [...new Set(all.flatMap((value) => value.skills))], languages: [...new Set(all.flatMap((value) => value.languages))] });
export const skillBonus = (character: Character, skill: SkillKey) => abilityModifier(character.abilities[skillAbilities[skill]]) + (character.proficiencies.skills.includes(skill) ? proficiencyBonus(character.level) * (character.expertise.includes(skill) ? 2 : 1) : 0);
export const isComplete = (character: Character) => Boolean(character.identity.name.trim() && character.speciesId && character.classId && character.backgroundId && isValidPointBuy(character.abilities) && !character.pendingChoices.some((choice) => choice.required && choice.status === "pending"));
