import { CatalogEntry, ClassEntry } from "@/domain/types";

export const species: CatalogEntry[] = [
  { kind: "species", id: "species|human|srd", name: "Humano", source: "SRD", description: "Adaptável e versátil.", traits: ["Versatilidade", "Idiomas adicionais"] },
  { kind: "species", id: "species|elf|srd", name: "Elfo", source: "SRD", description: "Ágil, atento e ligado à magia.", traits: ["Visão no escuro", "Sentidos aguçados"] },
  { kind: "species", id: "species|dwarf|srd", name: "Anão", source: "SRD", description: "Resistente e determinado.", traits: ["Visão no escuro", "Resiliência anã"] },
];
const seedClasses = [
  { kind: "class", id: "class|fighter|srd", name: "Guerreiro", source: "SRD", description: "Um mestre do combate marcial.", traits: ["Estilo de luta", "Retomar o fôlego"], proficiencyChoices: ["Acrobacia", "Atletismo", "Intimidação", "Percepção", "Sobrevivência"], hitDie: 10, subclasses: [{ kind: "subclass", id: "subclass|champion|srd", name: "Campeão", source: "SRD", description: "Excelência física e golpes decisivos.", traits: ["Crítico aprimorado"] }] },
  { kind: "class", id: "class|wizard|srd", name: "Mago", source: "SRD", description: "Um estudioso da magia arcana.", traits: ["Conjuração", "Recuperação arcana"], proficiencyChoices: ["Arcanismo", "História", "Investigação", "Medicina", "Religião"], hitDie: 6, subclasses: [{ kind: "subclass", id: "subclass|evocation|srd", name: "Evocação", source: "SRD", description: "Magia elementar ofensiva.", traits: ["Erudição em evocação"] }] },
  { kind: "class", id: "class|rogue|srd", name: "Ladino", source: "SRD", description: "Especialista em perícias e ataques precisos.", traits: ["Especialização", "Ataque furtivo"], proficiencyChoices: ["Acrobacia", "Enganação", "Furtividade", "Investigação", "Percepção"], hitDie: 8, subclasses: [{ kind: "subclass", id: "subclass|thief|srd", name: "Ladrão", source: "SRD", description: "Mãos rápidas e mobilidade.", traits: ["Mãos rápidas"] }] },
] as const;
export const classes: ClassEntry[] = seedClasses.map((entry) => ({ ...entry, traits: [...entry.traits], proficiencyChoices: [...entry.proficiencyChoices], proficiencies: { armor: [], weapons: [], tools: [], savingThrows: [], skills: [], languages: [] }, choices: [{ id: `${entry.id}|skill`, type: "skill", amount: 1, options: [...entry.proficiencyChoices], source: entry.id }], progression: [], subclassLevel: 3, subclasses: entry.subclasses.map((subclass) => ({ ...subclass, kind: "subclass", traits: [...subclass.traits], classId: entry.id, progression: [] })) }));
export const backgrounds: CatalogEntry[] = [
  { kind: "background", id: "background|acolyte|srd", name: "Acólito", source: "SRD", description: "Você serviu a um templo ou divindade.", traits: ["Abrigo dos fiéis"], proficiencyChoices: ["Intuição", "Religião"] },
  { kind: "background", id: "background|criminal|srd", name: "Criminoso", source: "SRD", description: "Você conhece os caminhos do submundo.", traits: ["Contato criminoso"], proficiencyChoices: ["Enganação", "Furtividade"] },
  { kind: "background", id: "background|sage|srd", name: "Sábio", source: "SRD", description: "Anos de estudo abriram seus horizontes.", traits: ["Pesquisador"], proficiencyChoices: ["Arcanismo", "História"] },
];
