import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet,
  useColorScheme, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { light, dark } from "@/constants/colors";

const CATEGORY_LABEL: Record<string, string> = {
  equipment: "연구 장비",
  facility: "시설",
  lab_instrument: "실험실습 기자재",
};
const CATEGORY_COLOR: Record<string, string> = {
  equipment: "#3b82f6",
  facility: "#10b981",
  lab_instrument: "#f59e0b",
};
const FILTERS = ["all", "equipment", "facility", "lab_instrument"];

interface PhysicalResource {
  id: string;
  name: string;
  category: string;
  organizationName: string;
  description: string;
  available: boolean;
  location?: string;
  contact?: string;
}

export default function PhysicalResourcesScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;

  const [items, setItems] = useState<PhysicalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "physical_resources"), orderBy("createdAt", "desc"), limit(100));
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name ?? "",
          category: d.data().category ?? "equipment",
          organizationName: d.data().organizationName ?? "",
          description: d.data().description ?? "",
          available: d.data().available ?? false,
          location: d.data().location,
          contact: d.data().contact,
        }))
      );
      setLoading(false);
    });
  }, []);

  let filtered = filter === "all" ? items : items.filter((i) => i.category === filter);
  if (availableOnly) filtered = filtered.filter((i) => i.available);

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
                {item === "all" ? "전체" : CATEGORY_LABEL[item]}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <TouchableOpacity
        style={[styles.availableToggle, { backgroundColor: availableOnly ? C.success + "18" : C.bg, borderColor: availableOnly ? C.success : C.border }]}
        onPress={() => setAvailableOnly(!availableOnly)}
      >
        <Ionicons name={availableOnly ? "checkmark-circle" : "ellipse-outline"} size={16} color={availableOnly ? C.success : C.subtext} />
        <Text style={{ fontSize: 13, color: availableOnly ? C.success : C.subtext, fontWeight: "500" }}>대여 가능만 보기</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={[styles.empty, { color: C.subtext }]}>등록된 물적 자원이 없습니다.</Text>}
          renderItem={({ item }) => {
            const color = CATEGORY_COLOR[item.category] ?? "#64748b";
            return (
              <View style={[styles.card, { backgroundColor: C.surface }]}>
                <View style={styles.top}>
                  <View style={[styles.iconBox, { backgroundColor: color + "18" }]}>
                    <Ionicons name="construct-outline" size={18} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: C.text }]}>{item.name}</Text>
                    <Text style={[styles.sub, { color: C.subtext }]}>{item.organizationName}</Text>
                  </View>
                  <View style={[styles.availBadge, { backgroundColor: item.available ? C.success + "18" : C.subtext + "18" }]}>
                    <Text style={{ fontSize: 11, color: item.available ? C.success : C.subtext, fontWeight: "600" }}>
                      {item.available ? "대여 가능" : "대여 불가"}
                    </Text>
                  </View>
                </View>

                <View style={[styles.catBadge, { backgroundColor: color + "1a" }]}>
                  <Text style={{ fontSize: 11, color, fontWeight: "600" }}>{CATEGORY_LABEL[item.category]}</Text>
                </View>

                <Text style={[styles.desc, { color: C.subtext }]} numberOfLines={2}>{item.description}</Text>

                {item.location && (
                  <Text style={[styles.meta, { color: C.subtext }]}>📍 {item.location}</Text>
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
  availableToggle: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginHorizontal: 14, marginTop: 10, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, alignSelf: "flex-start",
  },
  card: {
    padding: 14, borderRadius: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  iconBox: { width: 38, height: 38, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "600" },
  sub: { fontSize: 12, marginTop: 1 },
  availBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  catBadge: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, marginBottom: 6 },
  desc: { fontSize: 13, lineHeight: 19 },
  meta: { fontSize: 12, marginTop: 6 },
  empty: { textAlign: "center", marginTop: 60, fontSize: 14 },
});
