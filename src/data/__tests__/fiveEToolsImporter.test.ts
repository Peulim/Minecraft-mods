import { importFiveEToolsDocuments } from "../fiveEToolsImporter";

describe("5etools batch importer", () => {
  it("joins class and feature files before normalization", () => {
    const result = importFiveEToolsDocuments([
      { name: "class.json", contents: JSON.stringify({ class: [{ name: "Wizard", source: "PHB", classFeatures: ["Spellcasting|Wizard|PHB|1"] }] }) },
      { name: "features.json", contents: JSON.stringify({ classFeature: [{ name: "Spellcasting", className: "Wizard", classSource: "PHB", source: "PHB", level: 1, entries: ["Cast spells."] }] }) },
    ]);
    expect(result.files).toBe(2);
    expect(result.catalog.classes[0].progression[0].featureIds).toEqual([result.catalog.features[0].id]);
  });

  it("reports the file that contains invalid JSON", () => {
    expect(() => importFiveEToolsDocuments([{ name: "broken.json", contents: "{" }])).toThrow("broken.json: JSON inválido");
  });
});
