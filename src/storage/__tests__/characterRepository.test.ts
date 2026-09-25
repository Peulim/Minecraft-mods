jest.mock("@react-native-async-storage/async-storage", () => { let value: string | null = null; return { getItem: jest.fn(async () => value), setItem: jest.fn(async (_key, next) => { value = next; }) }; });
import { characterRepository } from "../characterRepository";
import { createDraft } from "@/domain/characterRules";
describe("character persistence", () => { it("reconstructs modern fields after save", async () => { const draft = { ...createDraft(), identity: { name: "Mira" } }; await characterRepository.save(draft); const restored = (await characterRepository.list())[0]; expect(restored.identity.name).toBe("Mira"); expect(restored.proficiencies.skills).toEqual([]); expect(restored.pendingChoices).toEqual([]); }); });
