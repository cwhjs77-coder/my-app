import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  useColorScheme, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp, increment,
} from "firebase/firestore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { light, dark } from "@/constants/colors";
import { ChatStackParamList } from "@/navigation/types";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  read: boolean;
  createdAt: Date | null;
}

type Props = NativeStackScreenProps<ChatStackParamList, "Chat">;

export default function ChatScreen({ route }: Props) {
  const { chatId, otherUserId, otherUserName } = route.params;
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;
  const { firebaseUser, userProfile } = useAuthContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200)
    );
    return onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({
          id: d.id,
          senderId: d.data().senderId ?? "",
          senderName: d.data().senderName ?? "",
          message: d.data().message ?? "",
          read: d.data().read ?? false,
          createdAt: d.data().createdAt?.toDate() ?? null,
        }))
      );
      setLoading(false);
    });
  }, [chatId]);

  // 스크롤을 최하단으로
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function sendMessage() {
    if (!text.trim() || !firebaseUser || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        chatId,
        senderId: firebaseUser.uid,
        senderName: userProfile?.name ?? "나",
        receiverId: otherUserId,
        message: content,
        read: false,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: content,
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${otherUserId}`]: increment(1),
      });
    } catch (err) {
      console.error("[ChatScreen] 메시지 전송 실패:", err);
    } finally {
      setSending(false);
    }
  }

  function formatTime(date: Date | null): string {
    if (!date) return "";
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }

  const myUid = firebaseUser?.uid ?? "";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, gap: 6, paddingBottom: 16 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: C.subtext }]}>
                {otherUserName}님과의 대화를 시작하세요.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === myUid;
            return (
              <View style={[styles.msgRow, isMine ? styles.msgRight : styles.msgLeft]}>
                {!isMine && (
                  <View style={[styles.avatar, { backgroundColor: C.border }]}>
                    <Text style={{ fontSize: 14 }}>👤</Text>
                  </View>
                )}
                <View style={{ maxWidth: "72%" }}>
                  {!isMine && (
                    <Text style={[styles.senderName, { color: C.subtext }]}>{item.senderName}</Text>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isMine
                        ? { backgroundColor: C.primary }
                        : { backgroundColor: C.surface },
                    ]}
                  >
                    <Text style={{ color: isMine ? "#fff" : C.text, fontSize: 14, lineHeight: 20 }}>
                      {item.message}
                    </Text>
                  </View>
                  <Text style={[styles.time, { color: C.subtext, textAlign: isMine ? "right" : "left" }]}>
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* 입력창 */}
      <View style={[styles.inputBar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: C.bg, color: C.text, borderColor: C.border }]}
          value={text}
          onChangeText={setText}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor={C.subtext}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: text.trim() ? C.primary : C.border }]}
          onPress={sendMessage}
          disabled={!text.trim() || sending}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  msgLeft: { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end" },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  senderName: { fontSize: 11, marginBottom: 2 },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, maxWidth: "100%" },
  time: { fontSize: 10, marginTop: 2 },
  emptyBox: { flex: 1, alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 14 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
});
