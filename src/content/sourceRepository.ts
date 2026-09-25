import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameCatalog } from "@/domain/types";
import { InstalledSource, SourceInstallation } from "./types";
const INDEX = "@rune/content/installed/v1"; const MANIFEST = "@rune/content/manifest-url/v1"; const MANUAL = "@rune/content/manual-catalog/v1"; const sourceKey = (id: string) => `@rune/content/source/v1/${id}`;
export const sourceRepository = {
  async list(): Promise<InstalledSource[]> { const value = await AsyncStorage.getItem(INDEX); return value ? JSON.parse(value) : []; },
  async get(sourceId: string): Promise<SourceInstallation | undefined> { const value = await AsyncStorage.getItem(sourceKey(sourceId)); return value ? JSON.parse(value) : undefined; },
  async save(installation: SourceInstallation) { const installed = (await this.list()).filter((entry) => entry.sourceId !== installation.metadata.sourceId); installed.push(installation.metadata); await AsyncStorage.multiSet([[sourceKey(installation.metadata.sourceId), JSON.stringify(installation)], [INDEX, JSON.stringify(installed)]]); },
  async remove(sourceId: string) { await AsyncStorage.removeItem(sourceKey(sourceId)); await AsyncStorage.setItem(INDEX, JSON.stringify((await this.list()).filter((entry) => entry.sourceId !== sourceId))); },
  async catalogs(): Promise<GameCatalog[]> { return (await Promise.all((await this.list()).map((entry) => this.get(entry.sourceId)))).flatMap((entry) => entry ? [entry.catalog] : []); },
  async getManualCatalog(): Promise<GameCatalog | undefined> { const value = await AsyncStorage.getItem(MANUAL); return value ? JSON.parse(value) : undefined; }, async saveManualCatalog(catalog: GameCatalog) { await AsyncStorage.setItem(MANUAL, JSON.stringify(catalog)); },
  async clearInstalled() { for (const entry of await this.list()) await AsyncStorage.removeItem(sourceKey(entry.sourceId)); await AsyncStorage.removeItem(INDEX); await AsyncStorage.removeItem(MANUAL); },
  async getManifestUrl() { return await AsyncStorage.getItem(MANIFEST) ?? process.env.EXPO_PUBLIC_CONTENT_MANIFEST_URL ?? ""; }, async setManifestUrl(url: string) { await AsyncStorage.setItem(MANIFEST, url.trim()); },
};
