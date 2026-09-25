import { GameCatalog } from "@/domain/types";

export type InstallPhase = "idle" | "fetchingMetadata" | "downloading" | "parsing" | "normalizing" | "saving" | "completed" | "error";
export interface InstallProgress { phase: InstallPhase; message: string; completed: number; total: number; }
export interface ContentCounts { classes?: number; subclasses?: number; species?: number; backgrounds?: number; feats?: number; spells?: number; items?: number; features?: number; }
export interface RemoteDataset { id: string; url: string; label: string; version?: string; hash?: string; }
export interface ContentSource { id: string; name: string; abbreviation: string; type?: string; version?: string; date?: string; datasets: RemoteDataset[]; expectedCounts?: ContentCounts; }
export interface InstalledSource { sourceId: string; name: string; installedAt: string; updatedAt: string; version?: string; hash?: string; provider: string; contentCounts: ContentCounts; }
export interface DownloadedDocument { name: string; contents: string; }
export interface ContentSourceProvider {
  readonly id: string;
  listSources(): Promise<ContentSource[]>;
  downloadSource(source: ContentSource, onProgress: (progress: InstallProgress) => void): Promise<DownloadedDocument[]>;
}
export interface SourceInstallation { metadata: InstalledSource; catalog: GameCatalog; }
