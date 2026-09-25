import { DataProvider } from "./DataProvider";
import { CatalogEntry, ClassEntry, GameCatalog } from "@/domain/types";

/** Queries a normalized, locally stored user import. It never downloads or redistributes source content. */
export class FiveEToolsImportProvider implements DataProvider {
  constructor(private readonly catalog: GameCatalog) {}
  getCatalog = async () => this.catalog;
  getSpecies = async () => this.catalog.species;
  getClasses = async () => this.catalog.classes;
  getSubclasses = async (classId?: string) => classId ? this.catalog.classes.find((entry) => entry.id === classId)?.subclasses ?? [] : this.catalog.classes.flatMap((entry) => entry.subclasses);
  getBackgrounds = async () => this.catalog.backgrounds;
  getFeats = async () => this.catalog.feats;
  getSpells = async () => this.catalog.spells;
  getItems = async () => this.catalog.items;
  getFeatures = async () => this.catalog.features;
  getClassById = async (id: string) => this.catalog.classes.find((entry) => entry.id === id);
  async getById(id: string): Promise<CatalogEntry | undefined> { return [...this.catalog.species, ...this.catalog.classes, ...this.catalog.backgrounds, ...this.catalog.feats, ...this.catalog.classes.flatMap((entry) => entry.subclasses)].find((entry) => entry.id === id); }
}
