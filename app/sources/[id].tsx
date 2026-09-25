import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { Button, ChoiceCard, Screen, Title, styles } from "@/components/ui";
import { createContentProvider } from "@/content/providers";
import { SourceManager } from "@/content/SourceManager";
import { sourceRepository } from "@/content/sourceRepository";
import { ContentSource, InstalledSource, InstallProgress } from "@/content/types";
import { useCatalog } from "@/state/CatalogContext";

export default function SourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { provider: catalogProvider, replaceCatalog } = useCatalog();
  const [source, setSource] = useState<ContentSource>(); const [installed, setInstalled] = useState<InstalledSource>(); const [progress, setProgress] = useState<InstallProgress>({ phase: "idle", message: "", completed: 0, total: 0 }); const [manager, setManager] = useState<SourceManager>();
  useEffect(() => { sourceRepository.getManifestUrl().then((url) => { const next = new SourceManager(createContentProvider(url), replaceCatalog); setManager(next); Promise.all([next.listAvailable(), next.listInstalled()]).then(([available, local]) => { setSource(available.find((entry) => entry.id === id)); setInstalled(local.find((entry) => entry.sourceId === id)); }).catch((error) => setProgress({ phase: "error", message: error.message, completed: 0, total: 0 })); }); }, [id, replaceCatalog]);
  if (!source || !manager) return <Screen><ActivityIndicator color="#A88BFA" /><Text style={[styles.muted, { marginTop: 12 }]}>{progress.message || "Carregando fonte…"}</Text></Screen>;
  const install = async () => { try { const current = await catalogProvider.getCatalog(); const metadata = await manager.install(source, current, setProgress); setInstalled(metadata); } catch (error) { setProgress({ phase: "error", message: error instanceof Error ? error.message : "Instalação falhou.", completed: 0, total: source.datasets.length }); } };
  const remove = () => Alert.alert("Remover fonte?", source.name, [{ text: "Cancelar", style: "cancel" }, { text: "Remover", style: "destructive", onPress: async () => { await manager.remove(source.id); setInstalled(undefined); router.back(); } }]);
  return <Screen><ScrollView><Title>{source.name}</Title><Text style={styles.muted}>{source.abbreviation} · {source.type ?? "Fonte"}{source.version ? ` · v${source.version}` : ""}{source.date ? ` · ${source.date}` : ""}</Text><Text style={[styles.cardTitle, { marginTop: 24 }]}>Datasets</Text>{source.datasets.map((dataset) => <ChoiceCard key={dataset.id} title={dataset.label} description={dataset.version ?? dataset.hash ?? dataset.id} onPress={() => {}} />)}{source.expectedCounts ? <View><Text style={styles.cardTitle}>Conteúdo anunciado</Text><Text style={styles.muted}>{Object.entries(source.expectedCounts).map(([type, count]) => `${type}: ${count}`).join(" · ")}</Text></View> : null}{progress.phase !== "idle" ? <View style={{ marginTop: 18 }}><Text style={{ color: progress.phase === "error" ? "#FF8494" : "#52D5A4" }}>{progress.message}</Text><Text style={styles.muted}>{progress.total ? `${progress.completed}/${progress.total}` : progress.phase}</Text></View> : null}<Button title={installed ? "Atualizar fonte" : "Importar fonte"} disabled={!(["idle", "completed", "error"].includes(progress.phase))} onPress={install} />{installed ? <Button title="Remover fonte" onPress={remove} /> : null}</ScrollView></Screen>;
}
