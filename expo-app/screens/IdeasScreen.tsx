import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet,
  useColorScheme, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { light, dark } from "@/constants/colors";

interface IdeaPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorOrg?: string;
  tags: string[];
  recruiting: boolean;
  viewCount: number;
  createdAt: Date | null;
}

export default function IdeasScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;

  const [items, setItems] = useState<IdeaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [recruitingOnly, setRecruitingOnly] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "ideas"), orderBy("createdAt", "desc"), limit(60));
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title ?? "",
          content: d.data().content ?? "",
          authorName: d.data().authorName ?? "",
          authorOrg: d.data().authorOrg,
          tags: d.data().tags ?? [],
          recruiting: d.data().recruiting ?? false,
          viewCount: d.data().viewCount ?? 0,
          createdAt: d.data().createdAt?.toDate() ?? null,
        }))
      );
      setLoading(false);
    });
  }, []);

  const filtered = recruitingOnly ? items.filter((i) => i.recruiting) : items;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TouchableOpacity
        style={[
          styles.toggle,
          {
            backgroundColor: recruitingOnly ? C.primary + "18" : C.bg,
            borderColor: recruitingOnly ? C.primary : C.border,
          },
        ]}
        onPress={() => setRecruitingOnly(!recruitingOnly)}
      >
        <Ionicons
          name={recruitingOnly ? "people-circle" : "people-circle-outline"}
          size={16}
          color={recruitingOnly ? C.primary : C.subtext}
        />
        <Text style={{ fontSize: 13, color: recruitingOnly ? C.primary : C.subtext, fontWeight: "500" }}>
          협업 모집 중만 보기
        </Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={[styles.empty, { color: C.subtext }]}>등록된 아이디어가 없습니다.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: C.surface }]}>
              <View style={styles.cardTop}>
                {item.recruiting && (
                  <View style={[styles.recruitBadge, { backgroundColor: C.primary + "18" }]}>
                    <Ionicons name="people-outline" size={11} color={C.primary} />
                    <Text style={{ fontSize: 11, color: C.primary, fontWeight: "600" }}>협업 모집 중</Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                  <Ionicons name="eye-outline" size={11} color={C.subtext} />
                  <Text style={{ fontSize: 11, color: C.subtext }}>{item.viewCount}</Text>
                </View>
              </View>

              <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>{item.title}</Text>
              <Text style={[styles.content, { color: C.subtext }]} numberOfLines={3}>{item.content}</Text>

              <View style={styles.meta}>
                <Text style={[styles.author, { color: C.subtext }]}>
                  {item.authorName}{item.authorOrg ? ` · ${item.authorOrg}` : ""}
                </Text>
                <Text style={[styles.date, { color: C.subtext }]}>
                  {item.createdAt ? item.createdAt.toLocaleDateString("ko-KR") : ""}
                </Text>
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
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginHorizontal: 14, marginTop: 12, marginBottom: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, alignSelf: "flex-start",
  },
  card: {
    padding: 14, borderRadius: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  recruitBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  title: { fontSize: 15, fontWeight: "600", lineHeight: 22, marginBottom: 4 },
  content: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  meta: { flexDirection: "row", justifyContent: "space-between" },
  author: { fontSize: 12, flex: 1 },
  date: { fontSize: 12 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  empty: { textAlign: "center", marginTop: 60, fontSize: 14 },
});
