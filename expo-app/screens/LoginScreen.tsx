import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator, Alert,
  useColorScheme, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { light, dark } from "@/constants/colors";

export default function LoginScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      const code: string = err?.code ?? "";
      let msg = "로그인에 실패했습니다. 다시 시도해주세요.";
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        msg = "이메일 또는 비밀번호가 올바르지 않습니다.";
      } else if (code === "auth/too-many-requests") {
        msg = "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
      } else if (code === "auth/invalid-email") {
        msg = "올바른 이메일 형식을 입력해주세요.";
      }
      Alert.alert("로그인 실패", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={[styles.logoBox, { backgroundColor: C.primary + "18" }]}>
              <Text style={{ fontSize: 32 }}>🏛️</Text>
            </View>
            <Text style={[styles.title, { color: C.text }]}>경남 지산학연</Text>
            <Text style={[styles.subtitle, { color: C.subtext }]}>
              산업·대학·연구기관 협력 네트워크
            </Text>
          </View>

          {/* 로그인 폼 */}
          <View style={styles.form}>
            <Text style={[styles.label, { color: C.subtext }]}>이메일</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.surface, color: C.text, borderColor: C.border }]}
              placeholder="이메일 주소를 입력하세요"
              placeholderTextColor={C.subtext}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              autoComplete="email"
            />

            <Text style={[styles.label, { color: C.subtext }]}>비밀번호</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.surface, color: C.text, borderColor: C.border }]}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor={C.subtext}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              autoComplete="current-password"
            />

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: C.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>로그인</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.hint, { color: C.subtext }]}>
            회원가입은 웹 앱(브라우저)에서 진행해주세요.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: { alignItems: "center", marginBottom: 40 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 13, textAlign: "center" },
  form: { width: "100%" },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 16,
  },
  btn: {
    width: "100%",
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 12, marginTop: 28, textAlign: "center" },
});
