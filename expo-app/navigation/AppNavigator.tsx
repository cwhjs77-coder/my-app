// ============================================================
// AppNavigator — 루트 네비게이션 (로그인 / 메인 분기)
// ============================================================

import React from "react";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import { NavigationContainer }          from "@react-navigation/native";
import { createNativeStackNavigator }   from "@react-navigation/native-stack";

import { useAuthContext } from "@/context/AuthContext";
import LoginScreen        from "@/screens/LoginScreen";
import TabNavigator       from "./TabNavigator";
import { light, dark }    from "@/constants/colors";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { firebaseUser, loading } = useAuthContext();
  const scheme = useColorScheme();
  const C      = scheme === "dark" ? dark : light;

  // Auth 상태 확인 중 — 로딩 스피너 표시
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
        {firebaseUser ? (
          // 로그인 완료 → 메인 화면(탭 네비게이터)
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          // 미로그인 → 로그인 화면
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
