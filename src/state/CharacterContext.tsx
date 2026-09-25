import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
import { Character } from "@/domain/types";
import { createDraft } from "@/domain/characterRules";
import { characterRepository } from "@/storage/characterRepository";
import { useCatalog } from "./CatalogContext";
import { rebuildCharacter } from "@/domain/characterEngine";
type State = { characters: Character[]; draft: Character; ready: boolean; begin: (character?: Character) => void; update: (patch: Partial<Character>) => void; save: () => Promise<Character>; saveCharacter: (character: Character) => Promise<Character> };
const CharacterContext = createContext<State | undefined>(undefined);
export function CharacterProvider({ children }: PropsWithChildren) {
  const { provider } = useCatalog();
  const [characters, setCharacters] = useState<Character[]>([]); const [draft, setDraft] = useState(createDraft()); const [ready, setReady] = useState(false);
  useEffect(() => { characterRepository.list().then(setCharacters).finally(() => setReady(true)); }, []);
  const update = (patch: Partial<Character>) => setDraft((current) => ({ ...current, ...patch }));
  const saveCharacter = async (character: Character) => { const rebuilt = rebuildCharacter(character, await provider.getCatalog()); const saved = await characterRepository.save(rebuilt); setCharacters(await characterRepository.list()); setDraft(saved); return saved; };
  const save = () => saveCharacter(draft);
  return <CharacterContext.Provider value={{ characters, draft, ready, begin: (character) => setDraft(character ?? createDraft()), update, save, saveCharacter }}>{children}</CharacterContext.Provider>;
}
export const useCharacters = () => { const context = useContext(CharacterContext); if (!context) throw new Error("CharacterProvider ausente"); return context; };
