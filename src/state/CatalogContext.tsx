import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GameCatalog } from "@/domain/types";
import { DataProvider } from "@/data/DataProvider";
import { FiveEToolsImportProvider } from "@/data/FiveEToolsImportProvider";
import { SeedDataProvider } from "@/data/providers";
import { mergeCatalog } from "@/data/fiveEToolsNormalizer";
import { catalogRepository } from "@/storage/catalogRepository";
import { sourceRepository } from "@/content/sourceRepository";
type CatalogState = { provider: DataProvider; catalog?: GameCatalog; ready: boolean; importCatalog: (catalog: GameCatalog) => Promise<void>; replaceCatalog: (catalog: GameCatalog) => Promise<void>; resetCatalog: () => Promise<void> };
const Context = createContext<CatalogState | undefined>(undefined);
export function CatalogProvider({ children }: PropsWithChildren) {
  const [catalog, setCatalog] = useState<GameCatalog>(); const [ready, setReady] = useState(false);
  useEffect(() => { catalogRepository.get().then(setCatalog).finally(() => setReady(true)); }, []);
  const provider = useMemo<DataProvider>(() => catalog ? new FiveEToolsImportProvider(catalog) : new SeedDataProvider(), [catalog]);
  const importCatalog = async (incoming: GameCatalog) => { const empty: GameCatalog = { version: 2, metadata: { schemaVersion: 2, sourceFormat: "5etools-compatible", counts: {}, presentTypes: [], uninterpreted: [] }, species: [], classes: [], backgrounds: [], feats: [], spells: [], items: [], features: [] }; const installed = await sourceRepository.list(); const manualBase = await sourceRepository.getManualCatalog() ?? (installed.length ? empty : catalog ?? empty); const manual = mergeCatalog(manualBase, incoming); await sourceRepository.saveManualCatalog(manual); let next = manual; for (const sourceCatalog of await sourceRepository.catalogs()) next = mergeCatalog(next, sourceCatalog); await catalogRepository.save(next); setCatalog(next); };
  const replaceCatalog = useCallback(async (next: GameCatalog) => { await catalogRepository.save(next); setCatalog(next); }, []);
  const resetCatalog = async () => { await sourceRepository.clearInstalled(); await catalogRepository.clear(); setCatalog(undefined); };
  return <Context.Provider value={{ provider, catalog, ready, importCatalog, replaceCatalog, resetCatalog }}>{children}</Context.Provider>;
}
export const useCatalog = () => { const value = useContext(Context); if (!value) throw new Error("CatalogProvider ausente"); return value; };
