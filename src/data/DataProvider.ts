import { CatalogEntry, CharacterFeature, ClassEntry, GameCatalog, Item, Spell } from "@/domain/types";

/** Isolates UI/rules from a bundled catalog, user import, or future sync source. */
export interface DataProvider {
  getSpecies(): Promise<CatalogEntry[]>;
  getClasses(): Promise<ClassEntry[]>;
  getSubclasses(classId?: string): Promise<CatalogEntry[]>;
  getBackgrounds(): Promise<CatalogEntry[]>;
  getFeats(): Promise<CatalogEntry[]>;
  getSpells(): Promise<Spell[]>;
  getItems(): Promise<Item[]>;
  getFeatures(): Promise<CharacterFeature[]>;
  getById(id: string): Promise<CatalogEntry | undefined>;
  getClassById(id: string): Promise<ClassEntry | undefined>;
  getCatalog(): Promise<GameCatalog>;
}
