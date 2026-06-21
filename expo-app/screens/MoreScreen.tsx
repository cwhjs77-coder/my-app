import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { light, dark } from "@/constants/colors";
import { MoreStackParamList } from "@/navigation/types";
import { useAuthContext } from "@/context/AuthContext";

type Nav = NativeStackNavigationProp<MoreStackParamList, "MoreMenu">;

interface MenuItem {
  key: keyof MoreStackParamList;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  { key: "Organizations", label: "기관 목록", icon: "business-outline", color: "#10b981", description: "산업체·대학·공공기관·연구기관" },
  { key: "HumanResources", label: "인적 자원", icon: "person-outline", color: "#8b5cf6", description: "전문가·연구자·교수 인적 자원" },
  { key: "PhysicalResources", label: "물적 자원", icon: "construct-outline", color: "#f59e0b", description: "연구장비·시설·실험실습 기자재" },
  { key: "Ideas", label: "아이디어·협업", icon: "bulb-outline", color: "#0ea5e9", description: "협업 아이디어 공유 및 모집" },
  { key: "Talent", label: "인재·채용", icon: "briefcase-outline", color: "#ef4444", description: "채용 공고 및 인재 프로필" },
  { key: "AIChat", label: "AI 도우미", icon: "hardware-chip-outline", color: "#6366f1", description: "플랫폼 이용 관련 AI 상담" },
  { key: "Feedback", label: "의견·개선", icon: "chatbox-outline", color: "#64748b", description: "플랫폼 개선 의견 및 문의" },
  { key: "Search", label: "통합 검색", icon: "search-outline", color: "#3b82f6", description: "전체 콘텐츠 통합 검색" },
  { key: "Profile", label: "내 프로필", icon: "person-circle-outline", color: "#f97316", description: "계정 정보 및 로그아웃" },
];

export default function MoreScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;
  const navigation = useNavigation<Nav>();
  const { userProfile } = useAuthContext();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 사용자 미니 프로필 */}
      <TouchableOpacity
        style={[styles.profileCard, { backgroundColor: C.surface }]}
        onPress={() => navigation.navigate("Profile")}
        activeOpacity={0.85}
      >
        <View style={[styles.profileAvatar, { backgroundColor: C.primary + "18" }]}>
          <Ionicons name="person" size={24} color={C.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: C.text }]}>{userProfile?.name ?? "회원"}</Text>
          <Text style={[styles.profileOrg, { color: C.subtext }]}>
            {userProfile?.organization ?? userProfile?.email ?? ""}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.subtext} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: C.subtext }]}>메뉴</Text>

      <View style={[styles.menuList, { backgroundColor: C.surface }]}>
        {MENU_ITEMS.map((item, index) => (
          <React.Fragment key={item.key}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate(item.key as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconBox, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: C.text }]}>{item.label}</Text>
                <Text style={[styles.menuDesc, { color: C.subtext }]}>{item.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.border} />
            </TouchableOpacity>
            {index < MENU_ITEMS.length - 1 && (
              <View style={[styles.divider, { backgroundColor: C.border, marginLeft: 60 }]} />
            )}
          </React.Fragment>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 14,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  profileAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { fontSize: 15, fontWeight: "700" },
  profileOrg: { fontSize: 12, marginTop: 2 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  menuList: {
    marginHorizontal: 14,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 14, fontWeight: "600" },
  menuDesc: { fontSize: 11, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth },
});
