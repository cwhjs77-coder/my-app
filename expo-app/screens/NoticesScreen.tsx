import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  useColorScheme, ActivityIndicator, Linking,
} from "react-native";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { light, dark } from "@/constants/colors";

const CATEGORY_LABEL: Record<string, string> = {
  policy: "정책 공고",
  research: "연구기술 개발 공모",
  recruitment: "채용 공고",
  other: "기타",
};
const CATEGORY_COLOR: Record<string, string> = {
  policy: "#3b82f6",
  research: "#8b5cf6",
  recruitment: "#ef4444",
  other: "#64748b",
};

interface Notice {
  id: string;
  title: string;
  category: string;
  url?: string;
  tags: string[];
  createdAt: Date | null;
  viewCount: number;
}

const FILTERS = ["all", "policy", "research", "recruitment", "other"];

export default function NoticesScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(60));
    return onSnapshot(q, (snap) => {
      setNotices(
        snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title ?? "(제목 없음)",
          category: d.data().category ?? "other",
          url: d.data().url,
          tags: d.data().tags ?? [],
          createdAt: d.data().createdAt?.toDate() ?? null,
          viewCount: d.data().viewCount ?? 0,
        }))
      );
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? notices : notices.filter((n) => n.category === filter);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* 카테고리 탭 */}
      <View style={[styles.filterBar, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  backgroundColor: filter === item ? C.primary : C.bg,
                  borderColor: filter === item ? C.primary : C.border,
                },
              ]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.chipText, { color: filter === item ? "#fff" : C.subtext }]}>
                {item === "all" ? "전체" : CATEGORY_LABEL[item]}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: C.subtext }]}>공지가 없습니다.</Text>
          }
          renderItem={({ item }) => {
            const catColor = CATEGORY_COLOR[item.category] ?? "#64748b";
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: C.surface }]}
                onPress={() => item.url && Linking.openURL(item.url).catch(console.error)}
                activeOpacity={item.url ? 0.75 : 1}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.badge, { backgroundColor: catColor + "1a" }]}>
                    <Text style={[styles.badgeText, { color: catColor }]}>
                      {CATEGORY_LABEL[item.category] ?? item.category}
                    </Text>
                  </View>
                  {item.url && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Ionicons name="open-outline" size={12} color={C.primary} />
                      <Text style={{ fontSize: 11, color: C.primary }}>링크</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.cardBottom}>
                  <Text style={[styles.meta, { color: C.subtext }]}>
                    {item.createdAt ? item.createdAt.toLocaleDateString("ko-KR") : "-"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Ionicons name="eye-outline" size={11} color={C.subtext} />
                    <Text style={[styles.meta, { color: C.subtext }]}>{item.viewCount}</Text>
                  </View>
                </View>

                {item.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {item.tags.slice(0, 4).map((tag) => (
                      <View key={tag} style={[styles.tag, { backgroundColor: C.bg }]}>
                        <Text style={{ fontSize: 10, color: C.subtext }}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "600" },
  card: {
    padding: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  title: { fontSize: 15, fontWeight: "500", lineHeight: 22 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  meta: { fontSize: 12 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  empty: { textAlign: "center", marginTop: 60, fontSize: 14 },
});
