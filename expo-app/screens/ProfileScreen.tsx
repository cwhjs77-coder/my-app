import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  useColorScheme, Alert, Switch,
} from "react-native";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { light, dark } from "@/constants/colors";

const ROLE_LABEL: Record<string, string> = {
  admin: "관리자",
  manager: "담당자",
  member: "회원",
};
const ROLE_COLOR: Record<string, string> = {
  admin: "#ef4444",
  manager: "#f59e0b",
  member: "#3b82f6",
};

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;
  const { firebaseUser, userProfile } = useAuthContext();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await signOut(auth);
          } catch (err) {
            Alert.alert("오류", "로그아웃에 실패했습니다.");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }

  const role = userProfile?.role ?? "member";
  const roleColor = ROLE_COLOR[role] ?? "#3b82f6";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* 프로필 헤더 */}
      <View style={[styles.profileHeader, { backgroundColor: C.surface }]}>
        <View style={[styles.avatar, { backgroundColor: C.primary + "18" }]}>
          <Ionicons name="person" size={36} color={C.primary} />
        </View>
        <Text style={[styles.name, { color: C.text }]}>{userProfile?.name ?? "회원"}</Text>
        <Text style={[styles.email, { color: C.subtext }]}>{userProfile?.email ?? firebaseUser?.email ?? ""}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + "18" }]}>
          <Text style={{ fontSize: 12, color: roleColor, fontWeight: "700" }}>{ROLE_LABEL[role]}</Text>
        </View>
      </View>

      {/* 소속 정보 */}
      {userProfile?.organization && (
        <View style={[styles.section, { backgroundColor: C.surface }]}>
          <Text style={[styles.sectionTitle, { color: C.subtext }]}>소속 기관</Text>
          <View style={styles.infoRow}>
            <Ionicons name="business-outline" size={18} color={C.primary} />
            <Text style={[styles.infoText, { color: C.text }]}>{userProfile.organization}</Text>
          </View>
        </View>
      )}

      {/* 관심분야 */}
      {(userProfile?.interests?.length ?? 0) > 0 && (
        <View style={[styles.section, { backgroundColor: C.surface }]}>
          <Text style={[styles.sectionTitle, { color: C.subtext }]}>관심분야</Text>
          <View style={styles.tagRow}>
            {userProfile!.interests.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: C.primaryBg }]}>
                <Text style={{ fontSize: 13, color: C.primary }}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 계정 정보 */}
      <View style={[styles.section, { backgroundColor: C.surface }]}>
        <Text style={[styles.sectionTitle, { color: C.subtext }]}>계정 정보</Text>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color={C.subtext} />
          <Text style={[styles.infoText, { color: C.text }]}>{firebaseUser?.email ?? ""}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: C.border }]} />
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={C.subtext} />
          <Text style={[styles.infoText, { color: C.text }]}>
            {userProfile?.approved ? "계정 승인됨" : "승인 대기 중"}
          </Text>
        </View>
      </View>

      {/* 앱 정보 */}
      <View style={[styles.section, { backgroundColor: C.surface }]}>
        <Text style={[styles.sectionTitle, { color: C.subtext }]}>앱 정보</Text>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={18} color={C.subtext} />
          <Text style={[styles.infoText, { color: C.text }]}>경남 지산학연 네트워크 v1.0.0</Text>
        </View>
      </View>

      {/* 로그아웃 */}
      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: C.danger + "18", borderColor: C.danger + "40" }]}
        onPress={handleLogout}
        disabled={loggingOut}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={18} color={C.danger} />
        <Text style={[styles.logoutText, { color: C.danger }]}>
          {loggingOut ? "로그아웃 중..." : "로그아웃"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    padding: 28,
    marginBottom: 12,
    gap: 6,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  name: { fontSize: 20, fontWeight: "700" },
  email: { fontSize: 13 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 4 },
  section: {
    marginHorizontal: 0,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionTitle: { fontSize: 12, fontWeight: "600", marginBottom: 10, textTransform: "uppercase" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  infoText: { fontSize: 14, flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "600" },
});
