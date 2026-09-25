import AsyncStorage from "@react-native-async-storage/async-storage";
import { Character } from "@/domain/types";
import { emptyProficiencies } from "@/domain/characterRules";
const KEY = "@rune/characters/v1";
export const characterRepository = {
  async list(): Promise<Character[]> { const raw = await AsyncStorage.getItem(KEY); return raw ? (JSON.parse(raw) as Partial<Character>[]).map((item) => ({ ...item, experience: item.experience ?? 0, proficiencies: item.proficiencies ?? emptyProficiencies(), expertise: item.expertise ?? [], selectedProficiencies: item.selectedProficiencies ?? (Array.isArray(item.proficiencies) ? item.proficiencies : []), choiceSelections: item.choiceSelections ?? {}, features: item.features ?? [], pendingChoices: item.pendingChoices ?? [], inventory: item.inventory ?? [], spells: Array.isArray(item.spells) ? { cantrips: [], known: item.spells, prepared: [], slots: {} } : item.spells ?? { cantrips: [], known: [], prepared: [], slots: {} }, feats: item.feats ?? [], resources: item.resources ?? {} } as Character)) : []; },
  async save(character: Character) { const all = await this.list(); const index = all.findIndex(({ id }) => id === character.id); const next = { ...character, updatedAt: new Date().toISOString() }; if (index >= 0) all[index] = next; else all.unshift(next); await AsyncStorage.setItem(KEY, JSON.stringify(all)); return next; },
};
