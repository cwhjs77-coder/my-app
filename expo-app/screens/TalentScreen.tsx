import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet,
  useColorScheme, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { light, dark } from "@/constants/colors";

const TYPE_LABEL: Record<string, string> = {
  recruitment: "채용 공고",
  talent_profile: "인재 프로필",
};
const TYPE_COLOR: Record<string, string> = {
  recruitment: "#ef4444",
  talent_profile: "#8b5cf6",
};
const FILTERS = ["all", "recruitment", "talent_profile"];

interface TalentPost {
  id: string;
  title: string;
  content: string;
  type: string;
  authorName: string;
  organizationName?: string;
  skills: string[];
  deadline?: string;
  salary?: string;
  location?: string;
  createdAt: Date | null;
}

export default function TalentScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;

  const [items, setItems] = useState<TalentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "talent"), orderBy("createdAt", "desc"), limit(60));
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title ?? "",
          content: d.data().content ?? "",
          type: d.data().type ?? "recruitment",
          authorName: d.data().authorName ?? "",
          organizationName: d.data().organizationName,
          skills: d.data().skills ?? [],
          deadline: d.data().deadline,
          salary: d.data().salary,
          location: d.data().location,
          createdAt: d.data().createdAt?.toDate() ?? null,
        }))
      );
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
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
                { backgroundColor: filter === item ? C.primary : C.bg, borderColor: filter === item ? C.primary : C.border },
              ]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.chipText, { color: filter === item ? "#fff" : C.subtext }]}>
                {item === "all" ? "전체" : TYPE_LABEL[item]}
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
          ListEmptyComponent={<Text style={[styles.empty, { color: C.subtext }]}>등록된 게시물이 없습니다.</Text>}
          renderItem={({ item }) => {
            const color = TYPE_COLOR[item.type] ?? "#64748b";
            return (
              <View style={[styles.card, { backgroundColor: C.surface }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.badge, { backgroundColor: color + "18" }]}>
                    <Text style={{ fontSize: 11, color, fontWeight: "600" }}>{TYPE_LABEL[item.type]}</Text>
                  </View>
                  {item.deadline && (
                    <Text style={{ fontSize: 11, color: C.warning }}>마감 {item.deadline}</Text>
                  )}
                </View>

                <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.content, { color: C.subtext }]} numberOfLines={2}>{item.content}</Text>

                {(item.organizationName || item.location) && (
                  <View style={styles.infoRow}>
                    {item.organizationName && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Ionicons name="business-outline" size={12} color={C.subtext} />
                        <Text style={{ fontSize: 12, color: C.subtext }}>{item.organizationName}</Text>
                      </View>
                    )}
                    {item.location && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Ionicons name="location-outline" size={12} color={C.subtext} />
                        <Text style={{ fontSize: 12, color: C.subtext }}>{item.location}</Text>
                      </View>
                    )}
                    {item.salary && (
                      <Text style={{ fontSize: 12, color: C.subtext }}>💰 {item.salary}</Text>
                    )}
                  </View>
                )}

                {item.skills.length > 0 && (
                  <View style={styles.tagRow}>
                    {item.skills.slice(0, 5).map((s) => (
                      <View key={s} style={[styles.tag, { backgroundColor: C.bg }]}>
                        <Text style={{ fontSize: 10, color: C.subtext }}>#{s}</Text>
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
    padding: 14, borderRadius: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  title: { fontSize: 15, fontWeight: "600", lineHeight: 22, marginBottom: 4 },
  content: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  infoRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  empty: { textAlign: "center", marginTop: 60, fontSize: 14 },
});
