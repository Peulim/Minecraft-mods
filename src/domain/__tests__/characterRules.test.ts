import { createDraft, pointsSpent } from "../characterRules";
describe("character creation rules", () => { it("starts with six scores at 8 and no spent points", () => { const draft = createDraft(); expect(pointsSpent(draft.abilities)).toBe(0); expect(draft.level).toBe(1); }); });
