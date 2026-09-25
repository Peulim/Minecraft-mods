import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { CatalogEntry, Item, Spell } from "@/domain/types";
import { Button, ChoiceCard, Input, Screen, Title, styles } from "./ui";
export type CatalogItem = CatalogEntry | Item | Spell;
export const CatalogSearch = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => <Input value={value} onChangeText={onChange} placeholder="🔍 Pesquisar..." />;
export function CatalogFilters({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (value: string) => void }) { return <FlatList horizontal data={options} keyExtractor={(item) => item} renderItem={({ item }) => <Pressable onPress={() => onSelect(item)} style={{ padding: 9, marginRight: 7, marginVertical: 10, borderRadius: 16, backgroundColor: selected === item ? "#A88BFA" : "#232A3A" }}><Text style={{ color: selected === item ? "#161023" : "#F4F6FC", fontWeight: "700" }}>{item}</Text></Pressable>} />; }
export const CatalogCard = ({ item, subtitle, onPress }: { item: CatalogItem; subtitle: string; onPress: () => void }) => <ChoiceCard title={item.name} description={subtitle} badge={item.source} onPress={onPress} />;
export function CatalogDetail({ item, children, action, onBack }: { item: CatalogItem; children?: ReactNode; action: { title: string; onPress: () => void }; onBack: () => void }) { return <Screen><Title>{item.name}</Title><Text style={styles.muted}>{item.description}</Text>{children}<Button title={action.title} onPress={action.onPress} /><Button title="Voltar" onPress={onBack} /></Screen>; }
export function CatalogScreen({ title, entries, subtitle, filterOptions = ["Todos"], filterValue, matchesFilter = () => true, onSelect }: { title: string; entries: CatalogItem[]; subtitle: (item: CatalogItem) => string; filterOptions?: string[]; filterValue?: (item: CatalogItem) => string; matchesFilter?: (item: CatalogItem, selected: string) => boolean; onSelect: (item: CatalogItem) => void }) {
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState("Todos");
  const options = useMemo(() => filterValue ? ["Todos", ...new Set(entries.map(filterValue).filter(Boolean))] : filterOptions, [entries, filterOptions, filterValue]);
  const filtered = useMemo(() => entries.filter((item) => `${item.name} ${item.source} ${subtitle(item)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()) && (filter === "Todos" || matchesFilter(item, filter))), [entries, filter, matchesFilter, query, subtitle]);
  return <Screen><Title>{title}</Title><CatalogSearch value={query} onChange={setQuery} /><CatalogFilters options={options} selected={filter} onSelect={setFilter} /><FlatList data={filtered} keyExtractor={(item) => item.id} initialNumToRender={16} windowSize={7} removeClippedSubviews renderItem={({ item }) => <CatalogCard item={item} subtitle={subtitle(item)} onPress={() => onSelect(item)} />} ListEmptyComponent={<Text style={styles.muted}>Nenhuma opção compatível encontrada.</Text>} /></Screen>;
}
