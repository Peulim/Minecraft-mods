import { DataProvider } from "./DataProvider";
import { backgrounds, classes, species } from "./seedData";
import { GameCatalog } from "@/domain/types";

export class SeedDataProvider implements DataProvider {
  private catalog: GameCatalog = { version: 2, metadata: { schemaVersion: 2, sourceFormat: "seed", counts: { species: species.length, classes: classes.length, backgrounds: backgrounds.length }, presentTypes: ["species", "classes", "backgrounds"], uninterpreted: [] }, species, classes, backgrounds, feats: [], spells: [], items: [], features: [] };
  getCatalog = async () => this.catalog;
  getSpecies = async () => species;
  getClasses = async () => classes;
  getSubclasses = async (classId?: string) => classId ? classes.find((entry) => entry.id === classId)?.subclasses ?? [] : classes.flatMap((entry) => entry.subclasses);
  getBackgrounds = async () => backgrounds;
  getFeats = async () => [];
  getSpells = async () => [];
  getItems = async () => [];
  getFeatures = async () => [];
  getById = async (id: string) => [...species, ...classes, ...backgrounds, ...classes.flatMap((entry) => entry.subclasses)].find((entry) => entry.id === id);
  getClassById = async (id: string) => classes.find((entry) => entry.id === id);
}
export const dataProvider: DataProvider = new SeedDataProvider();
