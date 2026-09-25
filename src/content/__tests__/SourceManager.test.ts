jest.mock("@react-native-async-storage/async-storage", () => { const values = new Map<string, string>(); return { getItem: jest.fn(async (key) => values.get(key) ?? null), setItem: jest.fn(async (key, value) => { values.set(key, value); }), removeItem: jest.fn(async (key) => { values.delete(key); }), multiSet: jest.fn(async (entries) => entries.forEach(([key, value]) => values.set(key, value))) }; });
import { SourceManager } from "../SourceManager";
import { ContentSourceProvider } from "../types";
import { SeedDataProvider } from "@/data/providers";

const source = { id: "XGE", name: "Xanathar", abbreviation: "XGE", version: "2", datasets: [{ id: "shared", label: "Shared", url: "https://example.test/shared.json", hash: "two" }] };
const provider: ContentSourceProvider = { id: "test", listSources: async () => [source], downloadSource: async (_source, progress) => { progress({ phase: "downloading", message: "Downloading", completed: 0, total: 1 }); return [{ name: "shared", contents: JSON.stringify({ feat: [{ name: "X Feat", source: "XGE" }, { name: "Core Feat", source: "PHB" }] }) }]; } };
describe("SourceManager", () => {
  it("filters, installs, tracks, rebuilds and removes a source transactionally", async () => { let applied = await new SeedDataProvider().getCatalog(); const manager = new SourceManager(provider, async (catalog) => { applied = catalog; }); const progress: string[] = []; const installed = await manager.install(source, applied, (state) => progress.push(state.phase)); expect(installed.contentCounts.feats).toBe(1); expect(applied.feats.map((feat) => feat.name)).toEqual(["X Feat"]); expect(progress).toEqual(expect.arrayContaining(["fetchingMetadata", "downloading", "normalizing", "saving", "completed"])); await manager.remove("XGE"); expect(applied.feats).toEqual([]); });
  it("detects updates using source versions", () => { const manager = new SourceManager(provider, async () => {}); expect(manager.hasUpdate(source, { sourceId: "XGE", name: "X", installedAt: "", updatedAt: "", version: "1", provider: "test", contentCounts: {} })).toBe(true); });
});
