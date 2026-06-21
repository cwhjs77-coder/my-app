import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  useColorScheme, ActivityIndicator,
} from "react-native";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { light, dark } from "@/constants/colors";

const CATEGORY_LABEL: Record<string, string> = {
  collaboration: "협업제안",
  tech_share: "기술공유",
  event: "행사·세미나",
  free: "자유게시판",
};
const CATEGORY_COLOR: Record<string, string> = {
  collaboration: "#3b82f6",
  tech_share: "#10b981",
  event: "#f59e0b",
  free: "#64748b",
};
const FILTERS = ["all", "collaboration", "tech_share", "event", "free"];

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorOrg?: string;
  tags: string[];
  viewCount: number;
  commentCount: number;
  pinned?: boolean;
  createdAt: Date | null;
}

export default function NetworkingScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "networking_posts"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(q, (snap) => {
      setPosts(
        snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title ?? "",
          content: d.data().content ?? "",
          category: d.data().category ?? "free",
          authorName: d.data().authorName ?? "",
          authorOrg: d.data().authorOrg,
          tags: d.data().tags ?? [],
          viewCount: d.data().viewCount ?? 0,
          commentCount: d.data().commentCount ?? 0,
          pinned: d.data().pinned ?? false,
          createdAt: d.data().createdAt?.toDate() ?? null,
        }))
      );
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? posts : posts.filter((p) => p.category === filter);

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
            <Text style={[styles.empty, { color: C.subtext }]}>게시글이 없습니다.</Text>
          }
          renderItem={({ item }) => {
            const catColor = CATEGORY_COLOR[item.category] ?? "#64748b";
            return (
              <View style={[styles.card, { backgroundColor: C.surface }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.badge, { backgroundColor: catColor + "1a" }]}>
                    <Text style={[styles.badgeText, { color: catColor }]}>
                      {CATEGORY_LABEL[item.category] ?? item.category}
                    </Text>
                  </View>
                  {item.pinned && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Ionicons name="pin" size={12} color={C.danger} />
                      <Text style={{ fontSize: 11, color: C.danger }}>공지</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.content, { color: C.subtext }]} numberOfLines={2}>
                  {item.content}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={[styles.author, { color: C.subtext }]}>
                    {item.authorName}
                    {item.authorOrg ? ` · ${item.authorOrg}` : ""}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Ionicons name="eye-outline" size={11} color={C.subtext} />
                      <Text style={[styles.metaNum, { color: C.subtext }]}>{item.viewCount}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Ionicons name="chatbubble-outline" size={11} color={C.subtext} />
                      <Text style={[styles.metaNum, { color: C.subtext }]}>{item.commentCount}</Text>
                    </View>
                  </View>
                </View>

                {item.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {item.tags.slice(0, 3).map((tag) => (
                      <View key={tag} style={[styles.tag, { backgroundColor: C.bg }]}>
                        <Text style={{ fontSize: 10, color: C.subtext }}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
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
  title: { fontSize: 15, fontWeight: "600", lineHeight: 22, marginBottom: 4 },
  content: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  author: { fontSize: 12, flex: 1 },
  metaNum: { fontSize: 12 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  empty: { textAlign: "center", marginTop: 60, fontSize: 14 },
});
