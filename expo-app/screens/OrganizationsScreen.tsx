import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  useColorScheme, ActivityIndicator, Linking,
} from "react-native";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { light, dark } from "@/constants/colors";

const TYPE_LABEL: Record<string, string> = {
  university: "대학",
  company: "기업",
  government: "공공기관",
  research: "연구기관",
};
const TYPE_COLOR: Record<string, string> = {
  university: "#3b82f6",
  company: "#10b981",
  government: "#f59e0b",
  research: "#8b5cf6",
};
const FILTERS = ["all", "university", "company", "government", "research"];

interface Org {
  id: string;
  name: string;
  type: string;
  homepage?: string;
  address?: string;
  description?: string;
}

export default function OrganizationsScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "organizations"), orderBy("name"), limit(100));
    return onSnapshot(q, (snap) => {
      setOrgs(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name ?? "",
          type: d.data().type ?? "company",
          homepage: d.data().homepage,
          address: d.data().address,
          description: d.data().description,
        }))
      );
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? orgs : orgs.filter((o) => o.type === filter);

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
          ListEmptyComponent={<Text style={[styles.empty, { color: C.subtext }]}>등록된 기관이 없습니다.</Text>}
          renderItem={({ item }) => {
            const color = TYPE_COLOR[item.type] ?? "#64748b";
            return (
              <View style={[styles.card, { backgroundColor: C.surface }]}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: color + "18" }]}>
                    <Ionicons name="business-outline" size={20} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <Text style={[styles.name, { color: C.text }]}>{item.name}</Text>
                      <View style={[styles.badge, { backgroundColor: color + "1a" }]}>
                        <Text style={{ fontSize: 10, color, fontWeight: "600" }}>{TYPE_LABEL[item.type]}</Text>
                      </View>
                    </View>
                    {item.address && (
                      <Text style={[styles.meta, { color: C.subtext }]} numberOfLines={1}>
                        📍 {item.address}
                      </Text>
                    )}
                    {item.description && (
                      <Text style={[styles.desc, { color: C.subtext }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  {item.homepage && (
                    <TouchableOpacity onPress={() => Linking.openURL(item.homepage!).catch(console.error)}>
                      <Ionicons name="open-outline" size={18} color={C.primary} />
                    </TouchableOpacity>
                  )}
                </View>
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
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "600" },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  meta: { fontSize: 12, marginTop: 2 },
  desc: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  empty: { textAlign: "center", marginTop: 60, fontSize: 14 },
});
