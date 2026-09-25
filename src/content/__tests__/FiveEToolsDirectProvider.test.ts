const storage = new Map<string, string>();
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key: string) => Promise.resolve(storage.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => { storage.set(key, value); return Promise.resolve(); }),
}));

import { FiveEToolsDirectProvider } from "../providers";

describe("FiveEToolsDirectProvider", () => {
  beforeEach(() => { storage.clear(); jest.restoreAllMocks(); });

  it("discovers books and resolves indexed class and spell datasets", async () => {
    const documents: Record<string, unknown> = {
      "books.json": { book: [{ name: "Test Book", source: "TST", published: "2026-01-01" }] },
      "class/index.json": { TST: "class-tst.json" },
      "spells/index.json": { TST: "spells-tst.json" },
    };
    global.fetch = jest.fn(async (url: string | URL | Request) => ({
      ok: true,
      text: async () => JSON.stringify(documents[String(url).split("/data/")[1]]),
    })) as jest.Mock;

    const [source] = await new FiveEToolsDirectProvider().listSources();

    expect(source.id).toBe("TST");
    expect(source.datasets.map((dataset) => dataset.url)).toContain("https://5e.tools/data/class/class-tst.json");
    expect(source.datasets.map((dataset) => dataset.url)).toContain("https://5e.tools/data/spells/spells-tst.json");
  });

  it("caches downloaded JSON instead of fetching it twice", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, text: async () => JSON.stringify({ feat: [] }) })) as jest.Mock;
    const provider = new FiveEToolsDirectProvider();
    const source = { id: "TST", name: "Test", abbreviation: "TST", datasets: [{ id: "feats-TST", label: "Feats", url: "https://5e.tools/data/feats.json" }] };

    await provider.downloadSource(source, () => {});
    await provider.downloadSource(source, () => {});

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
