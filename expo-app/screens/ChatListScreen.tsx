import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  useColorScheme, ActivityIndicator,
} from "react-native";
import {
  collection, query, where, orderBy, onSnapshot,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { light, dark } from "@/constants/colors";
import { ChatStackParamList } from "@/navigation/types";

interface ChatPreview {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string;
  lastMessage: string;
  lastMessageTime: Date | null;
  unreadCount: number;
}

type Nav = NativeStackNavigationProp<ChatStackParamList, "ChatList">;

export default function ChatListScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;
  const navigation = useNavigation<Nav>();
  const { firebaseUser } = useAuthContext();

  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", uid),
      orderBy("lastMessageTime", "desc")
    );
    return onSnapshot(q, (snap) => {
      setChats(
        snap.docs.map((d) => {
          const data = d.data();
          const participants: string[] = data.participants ?? [];
          const otherId = participants.find((p) => p !== uid) ?? "";
          return {
            id: d.id,
            otherUserId: otherId,
            otherUserName: data.participantNames?.[otherId] ?? "알 수 없음",
            otherUserPhoto: data.participantPhotos?.[otherId] ?? "",
            lastMessage: data.lastMessage ?? "",
            lastMessageTime: data.lastMessageTime?.toDate() ?? null,
            unreadCount: data.unreadCount?.[uid] ?? 0,
          };
        })
      );
      setLoading(false);
    });
  }, [firebaseUser]);

  function formatTime(date: Date | null): string {
    if (!date) return "";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "방금";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={C.border} />
              <Text style={[styles.emptyText, { color: C.subtext }]}>채팅이 없습니다.</Text>
              <Text style={[styles.emptyHint, { color: C.subtext }]}>
                네트워킹 화면에서 회원과 대화를 시작해보세요.
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: C.border }]} />
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { backgroundColor: C.surface }]}
              onPress={() =>
                navigation.navigate("Chat", {
                  chatId: item.id,
                  otherUserName: item.otherUserName,
                  otherUserId: item.otherUserId,
                })
              }
              activeOpacity={0.8}
            >
              <View style={[styles.avatar, { backgroundColor: C.primary + "18" }]}>
                <Text style={{ fontSize: 18 }}>👤</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.topRow}>
                  <Text style={[styles.name, { color: C.text }]}>{item.otherUserName}</Text>
                  <Text style={[styles.time, { color: C.subtext }]}>{formatTime(item.lastMessageTime)}</Text>
                </View>
                <View style={styles.bottomRow}>
                  <Text style={[styles.lastMsg, { color: C.subtext }]} numberOfLines={1}>
                    {item.lastMessage || "대화를 시작하세요"}
                  </Text>
                  {item.unreadCount > 0 && (
                    <View style={[styles.unread, { backgroundColor: C.primary }]}>
                      <Text style={styles.unreadText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 15, fontWeight: "600" },
  time: { fontSize: 12 },
  lastMsg: { flex: 1, fontSize: 13 },
  unread: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 74 },
  emptyContainer: { alignItems: "center", marginTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "500" },
  emptyHint: { fontSize: 13, textAlign: "center", paddingHorizontal: 32 },
});
