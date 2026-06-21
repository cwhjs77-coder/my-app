// ============================================================
// TabNavigator — 하단 탭 + Chat·More 스택 네비게이터
// ============================================================

import React from "react";
import { useColorScheme } from "react-native";
import { createBottomTabNavigator }   from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons }                   from "@expo/vector-icons";

import DashboardScreen       from "@/screens/DashboardScreen";
import NoticesScreen         from "@/screens/NoticesScreen";
import NetworkingScreen      from "@/screens/NetworkingScreen";
import ChatListScreen        from "@/screens/ChatListScreen";
import ChatScreen            from "@/screens/ChatScreen";
import MoreScreen            from "@/screens/MoreScreen";
import OrganizationsScreen   from "@/screens/OrganizationsScreen";
import HumanResourcesScreen  from "@/screens/HumanResourcesScreen";
import PhysicalResourcesScreen from "@/screens/PhysicalResourcesScreen";
import IdeasScreen           from "@/screens/IdeasScreen";
import TalentScreen          from "@/screens/TalentScreen";
import AIChatScreen          from "@/screens/AIChatScreen";
import FeedbackScreen        from "@/screens/FeedbackScreen";
import SearchScreen          from "@/screens/SearchScreen";
import ProfileScreen         from "@/screens/ProfileScreen";

import { light, dark } from "@/constants/colors";
import { TabParamList, ChatStackParamList, MoreStackParamList } from "./types";

const Tab       = createBottomTabNavigator<TabParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

// ─── 채팅 스택 (채팅 목록 → 1:1 채팅방)
function ChatStackNavigator() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;
  return (
    <ChatStack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: C.surface },
        headerTintColor:  C.text,
        headerTitleStyle: { fontWeight: "600" },
        contentStyle:     { backgroundColor: C.bg },
      }}
    >
      <ChatStack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{ title: "채팅" }}
      />
      <ChatStack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: route.params.otherUserName })}
      />
    </ChatStack.Navigator>
  );
}

// ─── 더보기 스택 (메뉴 → 각 세부 화면)
function MoreStackNavigator() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;
  const sharedOpts = {
    headerStyle:      { backgroundColor: C.surface },
    headerTintColor:  C.text,
    headerTitleStyle: { fontWeight: "600" as const },
    contentStyle:     { backgroundColor: C.bg },
  };
  return (
    <MoreStack.Navigator screenOptions={sharedOpts}>
      <MoreStack.Screen name="MoreMenu"         component={MoreScreen}            options={{ title: "더보기" }} />
      <MoreStack.Screen name="Organizations"    component={OrganizationsScreen}   options={{ title: "기관 목록" }} />
      <MoreStack.Screen name="HumanResources"   component={HumanResourcesScreen}  options={{ title: "인적 자원" }} />
      <MoreStack.Screen name="PhysicalResources" component={PhysicalResourcesScreen} options={{ title: "물적 자원" }} />
      <MoreStack.Screen name="Ideas"            component={IdeasScreen}           options={{ title: "아이디어·협업" }} />
      <MoreStack.Screen name="Talent"           component={TalentScreen}          options={{ title: "인재·채용" }} />
      <MoreStack.Screen name="AIChat"           component={AIChatScreen}          options={{ title: "AI 도우미" }} />
      <MoreStack.Screen name="Feedback"         component={FeedbackScreen}        options={{ title: "의견·개선" }} />
      <MoreStack.Screen name="Search"           component={SearchScreen}          options={{ title: "통합 검색" }} />
      <MoreStack.Screen name="Profile"          component={ProfileScreen}         options={{ title: "내 프로필" }} />
    </MoreStack.Navigator>
  );
}

// ─── 하단 탭 네비게이터
export default function TabNavigator() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // 탭 아이콘: 활성/비활성 쌍
        tabBarIcon: ({ focused, color, size }) => {
          const iconMap: Record<string, [string, string]> = {
            HomeTab:       ["home",         "home-outline"],
            NoticesTab:    ["megaphone",     "megaphone-outline"],
            NetworkingTab: ["people",        "people-outline"],
            ChatTab:       ["chatbubbles",   "chatbubbles-outline"],
            MoreTab:       ["grid",          "grid-outline"],
          };
          const [active, inactive] = iconMap[route.name] ?? ["ellipse", "ellipse-outline"];
          return (
            <Ionicons
              name={(focused ? active : inactive) as any}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor:   C.primary,
        tabBarInactiveTintColor: C.subtext,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor:  C.border,
          borderTopWidth:  1,
        },
        headerStyle:      { backgroundColor: C.surface },
        headerTintColor:  C.text,
        headerTitleStyle: { fontWeight: "600" },
      })}
    >
      <Tab.Screen name="HomeTab"       component={DashboardScreen}    options={{ title: "홈" }} />
      <Tab.Screen name="NoticesTab"    component={NoticesScreen}      options={{ title: "공지·공고" }} />
      <Tab.Screen name="NetworkingTab" component={NetworkingScreen}   options={{ title: "네트워킹" }} />
      <Tab.Screen
        name="ChatTab"
        component={ChatStackNavigator}
        options={{ title: "채팅", headerShown: false }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStackNavigator}
        options={{ title: "더보기", headerShown: false }}
      />
    </Tab.Navigator>
  );
}
