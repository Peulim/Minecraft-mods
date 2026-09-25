import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useState } from "react";
import { router } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";
import { Button, ChoiceCard, Screen, Title, styles } from "@/components/ui";
import { ImportReport, importFiveEToolsDocuments } from "@/data/fiveEToolsImporter";
import { useCatalog } from "@/state/CatalogContext";

export default function Settings() {
  const { catalog, importCatalog, resetCatalog } = useCatalog();
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<ImportReport>();

  const importFiles = async () => {
    try {
      setBusy(true);
      const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true, multiple: true });
      if (result.canceled) return;
      const documents = await Promise.all(result.assets.map(async (asset) => ({ name: asset.name, contents: await FileSystem.readAsStringAsync(asset.uri) })));
      const nextReport = importFiveEToolsDocuments(documents);
      await importCatalog(nextReport.catalog);
      setReport(nextReport);
      Alert.alert("Importação concluída", `${nextReport.files} arquivo(s) e ${nextReport.entries} entradas normalizadas.${nextReport.warnings.length ? `\n\n${nextReport.warnings.join(" ")}` : ""}`);
    } catch (error) {
      Alert.alert("Não foi possível importar", error instanceof Error ? error.message : "Arquivo inválido.");
    } finally {
      setBusy(false);
    }
  };

  return <Screen><ScrollView>
    <View style={{ marginTop: 20 }}><Title>Dados do jogo</Title><Text style={styles.muted}>Selecione juntos os JSONs relacionados do 5etools. Tudo é lido e armazenado apenas neste dispositivo.</Text></View>
    <ChoiceCard title={catalog ? `Catálogo v${catalog.version} ativo` : "Catálogo de demonstração ativo"} description={catalog ? `${catalog.species.length} espécies · ${catalog.classes.length} classes · ${catalog.features.length} features · ${catalog.spells.length} magias · ${catalog.items.length} itens · ${catalog.metadata.uninterpreted.length} estruturas pendentes` : "Importe seus JSONs para substituir o pequeno catálogo local."} onPress={() => {}} />
    <Button title="Explorar fontes remotas" onPress={() => router.push("/sources")} />
    <Text style={[styles.cardTitle, { marginTop: 26 }]}>Importação manual</Text><Text style={[styles.muted, { marginTop: 5 }]}>Fallback para arquivos locais e desenvolvimento.</Text>
    <Button title={busy ? "Importando…" : "Importar arquivo local"} disabled={busy} onPress={importFiles} />
    {report ? <View style={{ marginTop: 20 }}><Text style={styles.cardTitle}>Última importação</Text><Text style={[styles.muted, { marginTop: 6 }]}>{report.files} arquivos · {report.entries} entradas</Text><Text style={[styles.muted, { marginTop: 6 }]}>{report.fileNames.join(" · ")}</Text>{report.warnings.map((warning) => <Text key={warning} style={{ color: "#FFB86B", marginTop: 5 }}>⚠ {warning}</Text>)}</View> : null}
    {catalog ? <Button title="Voltar ao catálogo de demonstração" onPress={() => Alert.alert("Remover catálogo importado?", "Personagens permanecem salvos, mas podem referenciar conteúdo que deixará de estar visível.", [{ text: "Cancelar", style: "cancel" }, { text: "Remover", style: "destructive", onPress: resetCatalog }])} /> : null}
    <Text style={[styles.cardTitle, { marginTop: 28 }]}>Como usar</Text>
    <Text style={[styles.muted, { marginTop: 8 }]}>Escolha um ou vários arquivos contendo `race`/`species`, `class`, `subclass`, `classFeature`, `subclassFeature`, `background`, `feat`, `spell` ou `item`. Arquivos relacionados são combinados antes da normalização, permitindo resolver referências entre classes e features.</Text>
  </ScrollView></Screen>;
}
