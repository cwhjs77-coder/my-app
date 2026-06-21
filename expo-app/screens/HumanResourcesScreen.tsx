import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, StyleSheet,
  useColorScheme, ActivityIndicator, TouchableOpacity, Linking,
} from "react-native";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { light, dark } from "@/constants/colors";

interface HumanResource {
  id: string;
  name: string;
  organizationName: string;
  position: string;
  expertise: string[];
  contact?: string;
  email?: string;
  description?: string;
}

export default function HumanResourcesScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;

  const [items, setItems] = useState<HumanResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "human_resources"), orderBy("createdAt", "desc"), limit(100));
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name ?? "",
          organizationName: d.data().organizationName ?? "",
          position: d.data().position ?? "",
          expertise: d.data().expertise ?? [],
          contact: d.data().contact,
          email: d.data().email,
          description: d.data().description,
        }))
      );
      setLoading(false);
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
          ListHeaderComponent={
            <Text style={[styles.header, { color: C.subtext }]}>총 {items.length}명</Text>
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: C.subtext }]}>등록된 인적 자원이 없습니다.</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: C.surface }]}>
              <View style={styles.top}>
                <View style={[styles.avatar, { backgroundColor: C.primary + "18" }]}>
                  <Ionicons name="person-outline" size={20} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: C.text }]}>{item.name}</Text>
                  <Text style={[styles.sub, { color: C.subtext }]}>
                    {item.position} · {item.organizationName}
                  </Text>
                </View>
                {item.email && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:${item.email}`).catch(console.error)}
                  >
                    <Ionicons name="mail-outline" size={18} color={C.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {item.description && (
                <Text style={[styles.desc, { color: C.subtext }]} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              {item.expertise.length > 0 && (
                <View style={styles.tagRow}>
                  {item.expertise.map((e) => (
                    <View key={e} style={[styles.tag, { backgroundColor: C.bg }]}>
                      <Text style={{ fontSize: 11, color: C.subtext }}>#{e}</Text>
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
  header: { fontSize: 12, marginBottom: 4 },
  card: {
    padding: 14, borderRadius: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "600" },
  sub: { fontSize: 12, marginTop: 1 },
  desc: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  empty: { textAlign: "center", marginTop: 60, fontSize: 14 },
});
