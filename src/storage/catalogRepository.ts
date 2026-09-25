import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameCatalog } from "@/domain/types";
const KEY = "@rune/catalog/v1";
export const catalogRepository = {
  async get(): Promise<GameCatalog | undefined> { const raw = await AsyncStorage.getItem(KEY); if (!raw) return undefined; const parsed = JSON.parse(raw) as GameCatalog; if (parsed.version !== 2) { await AsyncStorage.removeItem(KEY); return undefined; } return parsed; },
  async save(catalog: GameCatalog) { await AsyncStorage.setItem(KEY, JSON.stringify(catalog)); },
  async clear() { await AsyncStorage.removeItem(KEY); },
};
