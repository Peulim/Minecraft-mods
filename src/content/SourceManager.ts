import { importFiveEToolsDocuments } from "@/data/fiveEToolsImporter";
import { mergeCatalog } from "@/data/fiveEToolsNormalizer";
import { GameCatalog } from "@/domain/types";
import { sourceRepository } from "./sourceRepository";
import { ContentCounts, ContentSource, ContentSourceProvider, InstalledSource, InstallProgress } from "./types";

type Raw = Record<string, unknown>;
const sourceOf = (entry: Raw) => [entry.source, entry.classSource, entry.subclassSource].filter(Boolean).map(String);
function filterDocuments(documents: Array<{ name: string; contents: string }>, sourceId: string) {
  const parsed = documents.map((document) => ({ name: document.name, value: JSON.parse(document.contents) as Raw }));
  const selectedSubclasses = parsed.flatMap(({ value }) => Array.isArray(value.subclass) ? value.subclass as Raw[] : []).filter((entry) => sourceOf(entry).includes(sourceId));
  const requiredClasses = new Set(selectedSubclasses.map((entry) => `${entry.className}|${entry.classSource}`));
  return parsed.map(({ name, value }) => { const filtered: Raw = {}; for (const [key, entries] of Object.entries(value)) { if (key === "_meta") filtered[key] = entries; else if (Array.isArray(entries)) filtered[key] = entries.filter((entry) => { if (!entry || typeof entry !== "object") return false; const record = entry as Raw; if (sourceOf(record).includes(sourceId)) return true; return key === "class" && requiredClasses.has(`${record.name}|${record.source}`); }); } return { name, contents: JSON.stringify(filtered) }; });
}
const counts = (catalog: GameCatalog): ContentCounts => ({ classes: catalog.classes.length, subclasses: catalog.classes.reduce((total, entry) => total + entry.subclasses.length, 0), species: catalog.species.length, backgrounds: catalog.backgrounds.length, feats: catalog.feats.length, spells: catalog.spells.length, items: catalog.items.length, features: catalog.features.length });
const emptyCatalog = (): GameCatalog => ({ version: 2, metadata: { schemaVersion: 2, sourceFormat: "5etools-compatible", counts: {}, presentTypes: [], uninterpreted: [] }, species: [], classes: [], backgrounds: [], feats: [], spells: [], items: [], features: [] });

export class SourceManager {
  constructor(private readonly provider: ContentSourceProvider, private readonly applyCatalog: (catalog: GameCatalog) => Promise<void>) {}
  listAvailable() { return this.provider.listSources(); }
  listInstalled() { return sourceRepository.list(); }
  async install(source: ContentSource, currentCatalog: GameCatalog, onProgress: (progress: InstallProgress) => void): Promise<InstalledSource> {
    onProgress({ phase: "fetchingMetadata", message: "Preparando fonte…", completed: 0, total: source.datasets.length });
    const documents = await this.provider.downloadSource(source, onProgress);
    onProgress({ phase: "parsing", message: "Validando e filtrando datasets…", completed: documents.length, total: documents.length });
    const filtered = filterDocuments(documents, source.id);
    onProgress({ phase: "normalizing", message: "Normalizando conteúdo…", completed: documents.length, total: documents.length });
    const report = importFiveEToolsDocuments(filtered); const now = new Date().toISOString(); const previous = await sourceRepository.get(source.id);
    const metadata: InstalledSource = { sourceId: source.id, name: source.name, installedAt: previous?.metadata.installedAt ?? now, updatedAt: now, version: source.version, hash: source.datasets.map((entry) => entry.hash ?? entry.version ?? "").join("|"), provider: this.provider.id, contentCounts: counts(report.catalog) };
    onProgress({ phase: "saving", message: "Salvando catálogo…", completed: documents.length, total: documents.length });
    if (!(await sourceRepository.getManualCatalog())) await sourceRepository.saveManualCatalog(currentCatalog);
    try { await sourceRepository.save({ metadata, catalog: report.catalog }); const rebuilt = await this.rebuild(); await this.applyCatalog(rebuilt); } catch (error) { if (previous) await sourceRepository.save(previous); else await sourceRepository.remove(source.id); throw error; }
    onProgress({ phase: "completed", message: "Concluído.", completed: documents.length, total: documents.length }); return metadata;
  }
  async remove(sourceId: string) { const previous = await sourceRepository.get(sourceId); await sourceRepository.remove(sourceId); try { await this.applyCatalog(await this.rebuild()); } catch (error) { if (previous) await sourceRepository.save(previous); throw error; } }
  async rebuild() { let catalog = await sourceRepository.getManualCatalog() ?? emptyCatalog(); for (const sourceCatalog of await sourceRepository.catalogs()) catalog = mergeCatalog(catalog, sourceCatalog); return catalog; }
  hasUpdate(source: ContentSource, installed: InstalledSource | undefined) { return Boolean(installed && source.version && installed.version && source.version !== installed.version); }
}
