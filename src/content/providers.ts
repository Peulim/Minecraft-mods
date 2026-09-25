import AsyncStorage from "@react-native-async-storage/async-storage";
import { importFiveEToolsDocuments } from "@/data/fiveEToolsImporter";
import { ContentSource, ContentSourceProvider, DownloadedDocument, InstallProgress } from "./types";
import { parseRemoteManifest } from "./remoteManifest";

const CACHE_PREFIX = "@rune/content/cache/v1/";
export const FIVE_ETOOLS_DIRECT_SOURCE = "rune://5etools-direct";
const FIVE_ETOOLS_DATA_ROOT = "https://5e.tools/data";
const cacheKey = (url: string, version = "") => `${CACHE_PREFIX}${encodeURIComponent(`${url}|${version}`)}`;
const readJson = async (url: string) => {
  const key = cacheKey(url, "upstream");
  const cached = await AsyncStorage.getItem(key);
  if (cached) return JSON.parse(cached) as Record<string, unknown>;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`5etools: falha ao baixar ${url} (${response.status}).`);
  const contents = await response.text();
  const value = JSON.parse(contents) as Record<string, unknown>;
  await AsyncStorage.setItem(key, contents);
  return value;
};
export class LocalFileContentProvider { readonly id = "local-file"; import(documents: DownloadedDocument[]) { return importFiveEToolsDocuments(documents.map((document) => ({ name: document.name, contents: document.contents }))); } }
export class RemoteContentProvider implements ContentSourceProvider {
  readonly id = "remote-manifest-v1";
  constructor(private readonly manifestUrl: string) { if (!/^https:\/\//.test(manifestUrl)) throw new Error("Configure uma URL HTTPS de manifesto."); }
  async listSources() { const response = await fetch(this.manifestUrl, { headers: { Accept: "application/json" } }); if (!response.ok) throw new Error(`Falha ao carregar fontes (${response.status}).`); return parseRemoteManifest(await response.json()); }
  async downloadSource(source: ContentSource, onProgress: (progress: InstallProgress) => void): Promise<DownloadedDocument[]> {
    const documents: DownloadedDocument[] = [];
    for (let index = 0; index < source.datasets.length; index += 1) {
      const dataset = source.datasets[index]; onProgress({ phase: "downloading", message: `Baixando ${dataset.label}…`, completed: index, total: source.datasets.length });
      const key = cacheKey(dataset.url, dataset.hash ?? dataset.version); let contents = await AsyncStorage.getItem(key);
      if (!contents) { const response = await fetch(dataset.url, { headers: { Accept: "application/json" } }); if (!response.ok) throw new Error(`${dataset.label}: download falhou (${response.status}).`); contents = await response.text(); JSON.parse(contents); await AsyncStorage.setItem(key, contents); }
      documents.push({ name: dataset.id, contents });
    }
    return documents;
  }
}

/** Adaptador de desenvolvimento para os JSONs publicados pelo próprio site 5e.tools. */
export class FiveEToolsDirectProvider implements ContentSourceProvider {
  readonly id = "5etools-direct-experimental";

  async listSources(): Promise<ContentSource[]> {
    const [booksDocument, classIndex, spellIndex] = await Promise.all([
      readJson(`${FIVE_ETOOLS_DATA_ROOT}/books.json`),
      readJson(`${FIVE_ETOOLS_DATA_ROOT}/class/index.json`),
      readJson(`${FIVE_ETOOLS_DATA_ROOT}/spells/index.json`),
    ]);
    const books = Array.isArray(booksDocument.book) ? booksDocument.book as Array<Record<string, unknown>> : [];
    const classes = classIndex as Record<string, string>;
    const spells = spellIndex as Record<string, string>;
    return books.flatMap((book) => {
      const source = String(book.source ?? book.id ?? "");
      if (!source) return [];
      const datasets: Array<[string, string, string]> = [
        ["species", "Espécies", `${FIVE_ETOOLS_DATA_ROOT}/races.json`],
        ["backgrounds", "Backgrounds", `${FIVE_ETOOLS_DATA_ROOT}/backgrounds.json`],
        ["feats", "Feats", `${FIVE_ETOOLS_DATA_ROOT}/feats.json`],
        ["items", "Itens", `${FIVE_ETOOLS_DATA_ROOT}/items.json`],
      ];
      if (classes[source]) datasets.push(["classes", "Classes e subclasses", `${FIVE_ETOOLS_DATA_ROOT}/class/${classes[source]}`]);
      if (spells[source]) datasets.push(["spells", "Magias", `${FIVE_ETOOLS_DATA_ROOT}/spells/${spells[source]}`]);
      return [{ id: source, abbreviation: source, name: String(book.name ?? source), type: String(book.group ?? "Livro"), date: typeof book.published === "string" ? book.published : undefined, version: typeof book.edition === "string" ? book.edition : undefined, datasets: datasets.map(([id, label, url]) => ({ id: `${id}-${source}`, label, url })) }];
    });
  }

  async downloadSource(source: ContentSource, onProgress: (progress: InstallProgress) => void) {
    const documents: DownloadedDocument[] = [];
    for (let index = 0; index < source.datasets.length; index += 1) {
      const dataset = source.datasets[index];
      onProgress({ phase: "downloading", message: `Baixando ${dataset.label}…`, completed: index, total: source.datasets.length });
      documents.push({ name: dataset.id, contents: JSON.stringify(await readJson(dataset.url)) });
    }
    return documents;
  }
}

export const createContentProvider = (location: string): ContentSourceProvider => location === FIVE_ETOOLS_DIRECT_SOURCE
  ? new FiveEToolsDirectProvider()
  : new RemoteContentProvider(location.trim());
