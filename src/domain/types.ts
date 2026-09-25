export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type SkillKey = "acrobatics" | "animalHandling" | "arcana" | "athletics" | "deception" | "history" | "insight" | "intimidation" | "investigation" | "medicine" | "nature" | "perception" | "performance" | "persuasion" | "religion" | "sleightOfHand" | "stealth" | "survival";
export type ContentKind = "species" | "class" | "background" | "subclass" | "feat" | "spell" | "item" | "feature";
export type ChoiceType = "skill" | "language" | "tool" | "weapon" | "armor" | "feat" | "spell" | "expertise" | "subclass" | "abilityScore" | "equipment";

export interface CatalogEntry {
  kind: ContentKind;
  id: string;
  name: string;
  source: string;
  description: string;
  traits: string[];
  proficiencyChoices?: string[];
  proficiencies?: Proficiencies;
  choices?: ChoiceDefinition[];
  requirements?: Requirement[];
  metadata?: Record<string, unknown>;
}

export interface Requirement {
  type: "level" | "ability" | "proficiency" | "spellcasting" | "unknown";
  value?: string | number;
  ability?: AbilityKey;
  minimum?: number;
  raw?: unknown;
}

export interface ChoiceDefinition {
  id: string;
  type: ChoiceType;
  amount: number;
  options: string[];
  source: string;
  requirements?: Requirement[];
}

export interface Proficiencies {
  armor: string[];
  weapons: string[];
  tools: string[];
  savingThrows: AbilityKey[];
  skills: SkillKey[];
  languages: string[];
}

export interface CharacterFeature {
  id: string;
  name: string;
  description: string;
  source: string;
  level: number;
  classId?: string;
  subclassId?: string;
  requirements?: Requirement[];
  effects?: string[];
  choices?: ChoiceDefinition[];
  metadata?: Record<string, unknown>;
}

export interface ClassLevel {
  level: number;
  featureIds: string[];
  choices: ChoiceDefinition[];
  resources: Record<string, number | string>;
}

export interface SpellcastingProfile {
  ability?: AbilityKey;
  progression?: "full" | "half" | "third" | "pact" | "artificer" | "unknown";
  model: "known" | "prepared" | "book" | "unknown";
  cantripsByLevel: number[];
  spellsKnownByLevel: number[];
  slotsByLevel: number[][];
  maxSpellLevelByLevel: number[];
  metadata?: Record<string, unknown>;
}

export interface SubclassEntry extends CatalogEntry {
  kind: "subclass";
  classId: string;
  progression: ClassLevel[];
}

export interface ClassEntry extends CatalogEntry {
  kind: "class";
  hitDie: number;
  subclassLevel?: number;
  subclasses: SubclassEntry[];
  progression: ClassLevel[];
  proficiencies: Proficiencies;
  proficiencyChoices: string[];
  choices: ChoiceDefinition[];
  spellcasting?: SpellcastingProfile;
}

export interface PendingChoice extends ChoiceDefinition {
  selected: string[];
  status: "pending" | "resolved";
  required: boolean;
}

export interface CharacterResources {
  hitPoints?: { maximum: number; current: number };
  speed?: number;
  armorClass?: number;
  initiativeBonus?: number;
}

export interface Item {
  id: string; name: string; description: string; type: "weapon" | "armor" | "shield" | "tool" | "gear" | "other"; source: string;
  weight?: number; value?: string; properties: string[]; damage?: string; damageSecondary?: string; damageType?: string; range?: string;
  armorCategory?: "light" | "medium" | "heavy" | "shield"; armorClass?: number; dexterityCap?: number; bonus?: number;
  requirements?: Requirement[]; metadata?: Record<string, unknown>;
}
export interface InventoryEntry { itemId: string; quantity: number; equipped: boolean; notes?: string; }
export interface Spell { id: string; name: string; level: number; school: string; castingTime: string; range: string; components: string[]; duration: string; concentration: boolean; ritual: boolean; description: string; source: string; classes: string[]; metadata?: Record<string, unknown>; }
export interface CharacterSpells { cantrips: string[]; known: string[]; prepared: string[]; slots: Record<number, number>; spellcastingAbility?: AbilityKey; }

export interface CatalogMetadata {
  schemaVersion: 2;
  importedAt?: string;
  sourceFormat: "seed" | "5etools-compatible";
  counts: Record<string, number>;
  presentTypes: string[];
  uninterpreted: Array<{ path: string; reason: string }>;
}

export interface GameCatalog {
  version: 2;
  metadata: CatalogMetadata;
  species: CatalogEntry[];
  classes: ClassEntry[];
  backgrounds: CatalogEntry[];
  feats: CatalogEntry[];
  spells: Spell[];
  items: Item[];
  features: CharacterFeature[];
}

export interface Character {
  id: string; identity: { name: string }; speciesId?: string; classId?: string; subclassId?: string; backgroundId?: string;
  level: number; experience: number; abilities: Record<AbilityKey, number>; proficiencies: Proficiencies; expertise: SkillKey[];
  selectedProficiencies: string[]; choiceSelections: Record<string, string[]>; features: CharacterFeature[]; pendingChoices: PendingChoice[];
  inventory: InventoryEntry[]; spells: CharacterSpells; feats: string[]; resources: CharacterResources; createdAt: string; updatedAt: string;
}

export interface ValidationResult { valid: boolean; errors: string[]; warnings: string[]; }

export const abilityLabels: Record<AbilityKey, string> = { str: "Força", dex: "Destreza", con: "Constituição", int: "Inteligência", wis: "Sabedoria", cha: "Carisma" };
export const abilityKeys = Object.keys(abilityLabels) as AbilityKey[];
export const skillAbilities: Record<SkillKey, AbilityKey> = { acrobatics: "dex", animalHandling: "wis", arcana: "int", athletics: "str", deception: "cha", history: "int", insight: "wis", intimidation: "cha", investigation: "int", medicine: "wis", nature: "int", perception: "wis", performance: "cha", persuasion: "cha", religion: "int", sleightOfHand: "dex", stealth: "dex", survival: "wis" };
export const skillLabels: Record<SkillKey, string> = { acrobatics: "Acrobacia", animalHandling: "Lidar com Animais", arcana: "Arcanismo", athletics: "Atletismo", deception: "Enganação", history: "História", insight: "Intuição", intimidation: "Intimidação", investigation: "Investigação", medicine: "Medicina", nature: "Natureza", perception: "Percepção", performance: "Atuação", persuasion: "Persuasão", religion: "Religião", sleightOfHand: "Prestidigitação", stealth: "Furtividade", survival: "Sobrevivência" };
