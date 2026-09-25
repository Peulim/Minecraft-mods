import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button, ChoiceCard, Screen, Title, styles } from "@/components/ui";
import { abilityKeys, abilityLabels, GameCatalog, Item, skillLabels } from "@/domain/types";
import { abilityModifier, proficiencyBonus, skillBonus } from "@/domain/characterRules";
import { deriveAttacks, inventoryWeight, removeItem, setItemQuantity, toggleEquipped } from "@/domain/inventoryRules";
import { validateCharacter } from "@/domain/characterEngine";
import { useCharacters } from "@/state/CharacterContext";
import { useCatalog } from "@/state/CatalogContext";

const signed = (value: number) => `${value >= 0 ? "+" : ""}${value}`;
function Section({ title, children, initial = true }: { title: string; children: ReactNode; initial?: boolean }) {
  const [open, setOpen] = useState(initial);
  return <View style={{ marginTop: 20 }}><Pressable onPress={() => setOpen((value) => !value)}><Text style={styles.cardTitle}>{open ? "▾" : "▸"} {title}</Text></Pressable>{open ? <View style={{ marginTop: 10 }}>{children}</View> : null}</View>;
}

export default function CharacterSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { characters, begin, saveCharacter } = useCharacters(); const { provider } = useCatalog();
  const character = characters.find((item) => item.id === id);
  const [catalog, setCatalog] = useState<GameCatalog>();
  useEffect(() => { provider.getCatalog().then(setCatalog); }, [provider]);
  const names = useMemo(() => Object.fromEntries(catalog ? [...catalog.species, ...catalog.classes, ...catalog.backgrounds, ...catalog.classes.flatMap((entry) => entry.subclasses)].map((entry) => [entry.id, entry.name]) : []), [catalog]);
  if (!character || !catalog) return <Screen><Title>{character ? "Carregando ficha…" : "Personagem não encontrado"}</Title></Screen>;
  const items = catalog.items; const attacks = deriveAttacks(character, items); const validation = validateCharacter(character, catalog); const klass = catalog.classes.find((entry) => entry.id === character.classId);
  const updateInventory = (inventory: typeof character.inventory) => saveCharacter({ ...character, inventory });
  return <Screen><ScrollView showsVerticalScrollIndicator={false}>
    <View style={{ marginTop: 18 }}><Text style={{ color: "#A88BFA", fontWeight: "700" }}>NÍVEL {character.level} · PROF {signed(proficiencyBonus(character.level))}</Text><Title>{character.identity.name}</Title><Text style={styles.muted}>{names[character.speciesId ?? ""] ?? "—"} · {names[character.classId ?? ""] ?? "—"} · {names[character.subclassId ?? ""] ?? "Sem subclasse"} · {names[character.backgroundId ?? ""] ?? "—"}</Text></View>
    <Section title="ATRIBUTOS"><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{abilityKeys.map((key) => <View key={key} style={{ width: "30%", padding: 12, backgroundColor: "#191E2B", borderRadius: 12 }}><Text style={styles.muted}>{abilityLabels[key].slice(0, 3).toUpperCase()}</Text><Text style={styles.cardTitle}>{character.abilities[key]} <Text style={styles.muted}>{signed(abilityModifier(character.abilities[key]))}</Text></Text></View>)}</View></Section>
    <Section title="COMBATE"><ChoiceCard title={`HP ${character.resources.hitPoints?.current ?? "—"}/${character.resources.hitPoints?.maximum ?? "—"} · CA ${character.resources.armorClass ?? "—"}`} description={`Iniciativa ${signed(character.resources.initiativeBonus ?? abilityModifier(character.abilities.dex))} · Velocidade ${character.resources.speed ?? "—"}`} onPress={() => {}} />{attacks.map((attack) => <ChoiceCard key={attack.itemId} title={`${attack.name} ${signed(attack.attackBonus)}`} description={attack.damage} onPress={() => {}} />)}</Section>
    <Section title="PROFICIÊNCIAS"><ChoiceCard title="Saving Throws" description={character.proficiencies.savingThrows.map((value) => abilityLabels[value]).join(" · ") || "Nenhuma"} onPress={() => {}} /><ChoiceCard title="Skills" description={character.proficiencies.skills.map((value) => `${skillLabels[value]} ${signed(skillBonus(character, value))}`).join(" · ") || "Nenhuma"} onPress={() => {}} /><ChoiceCard title="Armas · Armaduras · Ferramentas · Idiomas" description={[character.proficiencies.weapons, character.proficiencies.armor, character.proficiencies.tools, character.proficiencies.languages].flat().join(" · ") || "Nenhuma"} onPress={() => {}} /></Section>
    <Section title="FEATURES">{character.features.map((feature) => <ChoiceCard key={feature.id} title={`${feature.name} · Nv ${feature.level}`} description={feature.description || feature.source} onPress={() => {}} />)}</Section>
    <Section title="SPELLCASTING" initial={false}><Text style={styles.muted}>{klass?.spellcasting ? `Atributo: ${klass.spellcasting.ability?.toUpperCase() ?? "—"} · Progressão: ${klass.spellcasting.progression} · Modelo: ${klass.spellcasting.model}` : "Esta classe não possui perfil de spellcasting estruturado."}</Text><Text style={[styles.muted, { marginTop: 8 }]}>Truques: {character.spells.cantrips.length} · Conhecidas: {character.spells.known.length} · Preparadas: {character.spells.prepared.length}</Text><Button title="Adicionar magia" onPress={() => { begin(character); router.push("/catalog/spells"); }} /></Section>
    <Section title="FEATS" initial={false}>{character.feats.map((featId) => { const feat = catalog.feats.find((entry) => entry.id === featId); return <ChoiceCard key={featId} title={feat?.name ?? featId} description={feat?.description ?? "Ausente do catálogo"} onPress={() => {}} />; })}<Button title="Adicionar feat" onPress={() => { begin(character); router.push("/catalog/feats"); }} /></Section>
    <Section title={`INVENTÁRIO · ${inventoryWeight(character.inventory, items)} lb`}><Button title="Adicionar item" onPress={() => { begin(character); router.push("/catalog/items"); }} />{character.inventory.map((entry) => { const item = items.find((candidate) => candidate.id === entry.itemId); return <View key={entry.itemId} style={{ marginTop: 10 }}><ChoiceCard title={`${entry.equipped ? "✓ " : ""}${item?.name ?? entry.itemId}`} description={`Quantidade ${entry.quantity}${item?.weight ? ` · ${item.weight * entry.quantity} lb` : ""}`} onPress={() => updateInventory(toggleEquipped(character.inventory, entry.itemId))} /><View style={{ flexDirection: "row", gap: 8 }}><Button title="−" onPress={() => updateInventory(setItemQuantity(character.inventory, entry.itemId, entry.quantity - 1))} /><Button title="+" onPress={() => updateInventory(setItemQuantity(character.inventory, entry.itemId, entry.quantity + 1))} /><Button title="Remover" onPress={() => updateInventory(removeItem(character.inventory, entry.itemId))} /></View></View>; })}</Section>
    <Section title={`ESCOLHAS PENDENTES · ${character.pendingChoices.filter((choice) => choice.status === "pending").length}`} initial={false}>{character.pendingChoices.map((choice) => <ChoiceCard key={choice.id} title={`${choice.status === "resolved" ? "✓" : "⚠"} ${choice.type}`} description={`${choice.selected.length}/${choice.amount} · ${choice.source}`} onPress={() => { begin(character); router.push(`/choice/${encodeURIComponent(choice.id)}`); }} />)}</Section>
    <Section title="VALIDAÇÃO" initial={!validation.valid}>{validation.errors.map((message) => <Text key={message} style={{ color: "#FF8494", marginBottom: 6 }}>● {message}</Text>)}{validation.warnings.map((message) => <Text key={message} style={{ color: "#FFB86B", marginBottom: 6 }}>⚠ {message}</Text>)}{validation.valid && !validation.warnings.length ? <Text style={{ color: "#52D5A4" }}>✓ Personagem válido</Text> : null}</Section>
    <Button title="Editar personagem" onPress={() => { begin(character); router.push("/builder/identity"); }} />
  </ScrollView></Screen>;
}
