import { normalizeFiveEToolsJson } from "./fiveEToolsNormalizer";
import { GameCatalog } from "@/domain/types";

export interface ImportDocument {
  name: string;
  contents: string;
}

export interface ImportReport {
  catalog: GameCatalog;
  files: number;
  entries: number;
  warnings: string[];
  fileNames: string[];
}

type JsonObject = Record<string, unknown>;

function parseDocument(document: ImportDocument): JsonObject {
  let value: unknown;
  try {
    value = JSON.parse(document.contents);
  } catch {
    throw new Error(`${document.name}: JSON inválido.`);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${document.name}: a raiz precisa ser um objeto JSON.`);
  return value as JsonObject;
}

/** Combines related 5etools files before normalization so cross-file class/feature references can be resolved. */
export function importFiveEToolsDocuments(documents: ImportDocument[]): ImportReport {
  if (!documents.length) throw new Error("Selecione pelo menos um arquivo JSON.");
  const combined: JsonObject = {};
  for (const document of documents) {
    const parsed = parseDocument(document);
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) combined[key] = [...(Array.isArray(combined[key]) ? combined[key] as unknown[] : []), ...value];
      else if (key === "_meta") combined[key] = { ...((combined[key] as JsonObject | undefined) ?? {}), ...(value as JsonObject) };
      else combined[key] = value;
    }
  }
  const normalized = normalizeFiveEToolsJson(combined);
  const catalog = normalized.catalog;
  const entries = catalog.species.length + catalog.classes.length + catalog.backgrounds.length + catalog.feats.length + catalog.spells.length + catalog.items.length + catalog.features.length;
  return { catalog, files: documents.length, entries, warnings: normalized.warnings, fileNames: documents.map((document) => document.name) };
}
