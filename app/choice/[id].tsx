import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, ChoiceCard, Screen, Title, styles } from "@/components/ui";
import { useCharacters } from "@/state/CharacterContext";

export default function PendingChoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { draft, saveCharacter } = useCharacters();
  const choice = draft.pendingChoices.find((entry) => entry.id === id);
  const [selected, setSelected] = useState<string[]>(choice?.selected ?? []);
  if (!choice) return <Screen><Title>Escolha não encontrada</Title></Screen>;
  const toggle = (option: string) => setSelected((current) => current.includes(option) ? current.filter((value) => value !== option) : current.length < choice.amount ? [...current, option] : current);
  const confirm = async () => { let next = { ...draft, choiceSelections: { ...draft.choiceSelections, [choice.id]: selected } }; if (choice.type === "subclass") next = { ...next, subclassId: selected[0] }; if (choice.type === "feat") next = { ...next, feats: [...new Set([...next.feats, ...selected])] }; if (choice.type === "spell") next = { ...next, spells: { ...next.spells, known: [...new Set([...next.spells.known, ...selected])] } }; await saveCharacter(next); router.back(); };
  return <Screen><Title>{choice.type === "skill" ? "Escolher perícias" : `Escolher ${choice.type}`}</Title><Text style={styles.muted}>Selecione exatamente {choice.amount}. Origem: {choice.source}</Text><View style={{ marginTop: 16 }}>{choice.options.map((option) => <ChoiceCard key={option} title={option} description={selected.includes(option) ? "Selecionado" : "Toque para selecionar"} selected={selected.includes(option)} onPress={() => toggle(option)} />)}</View><Button title="Confirmar escolha" disabled={selected.length !== choice.amount} onPress={confirm} /></Screen>;
}
