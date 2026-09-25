import { parseRemoteManifest } from "../remoteManifest";
describe("remote content manifest", () => {
  it("discovers source metadata and datasets", () => { const sources = parseRemoteManifest({ schemaVersion: 1, sources: [{ id: "PHB", name: "Player Handbook", abbreviation: "PHB", version: "1", datasets: [{ id: "spells", label: "Spells", url: "https://example.test/spells.json" }] }] }); expect(sources[0].datasets[0].id).toBe("spells"); });
  it("rejects executable or insecure dataset locations", () => expect(() => parseRemoteManifest({ schemaVersion: 1, sources: [{ id: "X", name: "X", abbreviation: "X", datasets: [{ id: "x", label: "X", url: "http://example.test/x" }] }] })).toThrow("HTTPS"));
});
