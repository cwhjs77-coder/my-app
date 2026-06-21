import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  useColorScheme, SafeAreaView, StatusBar, ActivityIndicator,
} from "react-native";
import { collection, getCountFromServer } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { light, dark } from "@/constants/colors";

const STAT_ITEMS = [
  { label: "기관", collection: "organizations", icon: "business-outline", color: "#3b82f6" },
  { label: "인적 자원", collection: "human_resources", icon: "person-outline", color: "#8b5cf6" },
  { label: "물적 자원", collection: "physical_resources", icon: "construct-outline", color: "#f59e0b" },
  { label: "아이디어", collection: "ideas", icon: "bulb-outline", color: "#10b981" },
  { label: "인재·채용", collection: "talent", icon: "briefcase-outline", color: "#ef4444" },
  { label: "공지·공고", collection: "notices", icon: "megaphone-outline", color: "#0ea5e9" },
] as const;

export default function DashboardScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;
  const { userProfile } = useAuthContext();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      STAT_ITEMS.map(async (item) => {
        const snap = await getCountFromServer(collection(db, item.collection));
        return [item.collection, snap.data().count] as [string, number];
      })
    )
      .then((results) => {
        if (!cancelled) {
          setCounts(Object.fromEntries(results));
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* 인사말 */}
        <View style={styles.greeting}>
          <Text style={[styles.hello, { color: C.text }]}>
            안녕하세요, {userProfile?.name ?? "회원"}님 👋
          </Text>
          <Text style={[styles.sub, { color: C.subtext }]}>
            경남 지산학연 네트워크 플랫폼
          </Text>
          {userProfile?.organization && (
            <View style={[styles.orgBadge, { backgroundColor: C.primary + "18" }]}>
              <Ionicons name="business-outline" size={12} color={C.primary} />
              <Text style={[styles.orgText, { color: C.primary }]}>{userProfile.organization}</Text>
            </View>
          )}
        </View>

        {/* 통계 카드 */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>플랫폼 현황</Text>
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 32 }} />
        ) : (
          <View style={styles.grid}>
            {STAT_ITEMS.map((item) => (
              <View
                key={item.collection}
                style={[styles.card, { backgroundColor: C.surface }]}
              >
                <View style={[styles.iconBox, { backgroundColor: item.color + "18" }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={[styles.count, { color: C.text }]}>
                  {(counts[item.collection] ?? 0).toLocaleString()}
                </Text>
                <Text style={[styles.cardLabel, { color: C.subtext }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 안내 배너 */}
        <View style={[styles.banner, { backgroundColor: C.primaryBg, borderColor: C.primary + "30" }]}>
          <Ionicons name="notifications-outline" size={18} color={C.primary} />
          <Text style={[styles.bannerText, { color: C.primary }]}>
            관심분야와 일치하는 공지가 등록되면 푸시 알림으로 알려드립니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  greeting: { marginBottom: 24 },
  hello: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 8 },
  orgBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  orgText: { fontSize: 12, fontWeight: "500" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 14 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  card: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  count: { fontSize: 22, fontWeight: "700" },
  cardLabel: { fontSize: 12 },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
