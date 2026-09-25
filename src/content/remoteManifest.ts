import { ContentSource } from "./types";

interface RemoteManifest { schemaVersion: 1; sources: ContentSource[]; }
export function parseRemoteManifest(value: unknown): ContentSource[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Manifesto remoto inválido.");
  const manifest = value as Partial<RemoteManifest>;
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.sources)) throw new Error("Versão de manifesto remoto não suportada.");
  return manifest.sources.map((source) => {
    if (!source?.id || !source.name || !source.abbreviation || !Array.isArray(source.datasets)) throw new Error("Fonte incompleta no manifesto remoto.");
    if (!source.datasets.every((dataset) => dataset.id && dataset.label && /^https:\/\//.test(dataset.url))) throw new Error(`${source.name}: dataset remoto inválido ou sem HTTPS.`);
    return source;
  });
}
