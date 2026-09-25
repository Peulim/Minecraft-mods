import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text } from "react-native";
import { CatalogDetail, CatalogItem, CatalogScreen } from "@/components/catalog";
import { Spell } from "@/domain/types";
import { addItem } from "@/domain/inventoryRules";
import { checkRequirements, isSpellAvailable } from "@/domain/characterEngine";
import { useCatalog } from "@/state/CatalogContext";
import { useCharacters } from "@/state/CharacterContext";
import { styles } from "@/components/ui";

export default function RoutedCatalogScreen() {
  const { type } = useLocalSearchParams<{ type: "items" | "spells" | "feats" }>(); const { provider } = useCatalog(); const { draft, saveCharacter } = useCharacters();
  const [entries, setEntries] = useState<CatalogItem[]>([]); const [selected, setSelected] = useState<CatalogItem>(); const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof provider.getCatalog>>>();
  useEffect(() => { provider.getCatalog().then((value) => { setCatalog(value); setEntries(type === "items" ? value.items : type === "spells" ? value.spells : value.feats); }); }, [provider, type]);
  const visible = useMemo(() => type === "spells" && catalog?.classes.find((entry) => entry.id === draft.classId)?.spellcasting ? entries.filter((entry) => isSpellAvailable(draft, entry.id, catalog)) : entries, [catalog, draft, entries, type]);
  const add = async () => { if (!selected) return; let next = draft; if (type === "items") next = { ...draft, inventory: addItem(draft.inventory, selected.id) }; if (type === "feats") next = { ...draft, feats: [...new Set([...draft.feats, selected.id])] }; if (type === "spells") { const spell = selected as Spell; next = { ...draft, spells: spell.level === 0 ? { ...draft.spells, cantrips: [...new Set([...draft.spells.cantrips, spell.id])] } : { ...draft.spells, known: [...new Set([...draft.spells.known, spell.id])] } }; } await saveCharacter(next); router.back(); };
  if (selected) { const requirement = "requirements" in selected ? checkRequirements(selected.requirements, draft) : undefined; return <CatalogDetail item={selected} action={{ title: type === "items" ? "Adicionar ao inventário" : type === "spells" ? "Adicionar magia" : "Adicionar feat", onPress: add }} onBack={() => setSelected(undefined)}>{requirement?.unverifiable ? <Text style={[styles.muted, { color: "#FFB86B", marginTop: 12 }]}>Requisito não verificável automaticamente.</Text> : requirement && !requirement.met ? <Text style={{ color: "#FF8494", marginTop: 12 }}>Requisitos não atendidos.</Text> : null}</CatalogDetail>; }
  const title = type === "items" ? "Itens" : type === "spells" ? "Magias" : "Feats";
  const spellFilters = type === "spells" ? ["Todos", ...new Set((visible as Spell[]).flatMap((spell) => [`Nível ${spell.level}`, `Escola ${spell.school}`, ...spell.classes.map((name) => `Classe ${name}`)]))] : undefined;
  return <CatalogScreen title={title} entries={visible} subtitle={(item) => "level" in item ? `${item.level === 0 ? "Truque" : `Nível ${item.level}`} · ${item.school} · ${item.classes.join(", ")}` : item.description} filterOptions={spellFilters} filterValue={type === "spells" ? undefined : (item) => item.source} matchesFilter={(item, filter) => { if (!("level" in item)) return item.source === filter; if (filter.startsWith("Nível ")) return `Nível ${item.level}` === filter; if (filter.startsWith("Escola ")) return `Escola ${item.school}` === filter; return item.classes.some((name) => `Classe ${name}` === filter); }} onSelect={setSelected} />;
}
