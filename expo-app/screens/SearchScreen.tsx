import React, { useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  useColorScheme, ActivityIndicator, Linking,
} from "react-native";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { light, dark } from "@/constants/colors";

interface Result {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url?: string;
}

const TYPE_LABEL: Record<string, string> = {
  notices: "공지·공고",
  networking_posts: "네트워킹",
  organizations: "기관",
  human_resources: "인적 자원",
  ideas: "아이디어",
  talent: "인재·채용",
};
const TYPE_COLOR: Record<string, string> = {
  notices: "#0ea5e9",
  networking_posts: "#3b82f6",
  organizations: "#10b981",
  human_resources: "#8b5cf6",
  ideas: "#f59e0b",
  talent: "#ef4444",
};

const COLLECTIONS_CONFIG = [
  { col: "notices", titleField: "title", subtitleField: "category" },
  { col: "networking_posts", titleField: "title", subtitleField: "authorName" },
  { col: "organizations", titleField: "name", subtitleField: "type" },
  { col: "human_resources", titleField: "name", subtitleField: "position" },
  { col: "ideas", titleField: "title", subtitleField: "authorName" },
  { col: "talent", titleField: "title", subtitleField: "type" },
];

export default function SearchScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return;
    setLoading(true);
    setSearched(true);

    try {
      const allResults: Result[] = [];
      await Promise.all(
        COLLECTIONS_CONFIG.map(async ({ col, titleField, subtitleField }) => {
          const q = query(collection(db, col), orderBy(titleField), limit(100));
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            const titleVal: string = (d.data()[titleField] ?? "").toString();
            const subVal: string = (d.data()[subtitleField] ?? "").toString();
            if (titleVal.toLowerCase().includes(kw) || subVal.toLowerCase().includes(kw)) {
              allResults.push({
                id: `${col}_${d.id}`,
                type: col,
                title: titleVal,
                subtitle: subVal,
                url: d.data().url,
              });
            }
          });
        })
      );
      setResults(allResults);
    } catch (err) {
      console.error("[SearchScreen]", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[styles.searchBar, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <View style={[styles.inputWrapper, { backgroundColor: C.bg, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={16} color={C.subtext} />
          <TextInput
            style={[styles.input, { color: C.text }]}
            placeholder="공지, 기관, 인재 등 검색..."
            placeholderTextColor={C.subtext}
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoFocus
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => { setKeyword(""); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={16} color={C.subtext} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: C.primary }]}
          onPress={handleSearch}
        >
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>검색</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : searched ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, gap: 8, paddingBottom: 40 }}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: C.subtext }]}>
              "{keyword}" 검색 결과 {results.length}건
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={40} color={C.border} />
              <Text style={[styles.emptyText, { color: C.subtext }]}>검색 결과가 없습니다.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const color = TYPE_COLOR[item.type] ?? "#64748b";
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: C.surface }]}
                onPress={() => item.url && Linking.openURL(item.url).catch(console.error)}
                activeOpacity={item.url ? 0.75 : 1}
              >
                <View style={[styles.typeBadge, { backgroundColor: color + "18" }]}>
                  <Text style={{ fontSize: 10, color, fontWeight: "700" }}>{TYPE_LABEL[item.type]}</Text>
                </View>
                <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.subtitle, { color: C.subtext }]} numberOfLines={1}>{item.subtitle}</Text>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <View style={styles.hintBox}>
          <Ionicons name="search-outline" size={48} color={C.border} />
          <Text style={[styles.hintText, { color: C.subtext }]}>
            공지, 기관, 인적·물적 자원, 아이디어, 인재·채용 통합 검색
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  input: { flex: 1, fontSize: 14 },
  searchBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  resultCount: { fontSize: 12, marginBottom: 4 },
  card: {
    padding: 12, borderRadius: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  typeBadge: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, marginBottom: 5 },
  title: { fontSize: 14, fontWeight: "500", marginBottom: 2 },
  subtitle: { fontSize: 12 },
  hintBox: { alignItems: "center", marginTop: 80, gap: 12, paddingHorizontal: 32 },
  hintText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  emptyBox: { alignItems: "center", marginTop: 50, gap: 10 },
  emptyText: { fontSize: 14 },
});
