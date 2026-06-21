import React, { useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  useColorScheme, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { light, dark } from "@/constants/colors";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://my-app-inky-nine-80.vercel.app";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgIdCounter = 0;
function nextId() { return `msg_${++msgIdCounter}`; }

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "안녕하세요! 경남 지산학연 네트워크 플랫폼 AI 도우미입니다.\n\n기관 등록, 인적·물적 자원, 아이디어 협업, 인재 채용, 공지 등 플랫폼 이용에 관한 모든 질문을 해주세요.",
};

export default function AIChatScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  async function sendMessage() {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: nextId(), role: "user", content: text.trim() };
    const history = [...messages.filter((m) => m.id !== "welcome"), userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setText("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply: Message = {
        id: nextId(),
        role: "assistant",
        content: data.reply ?? "응답을 받지 못했습니다.",
      };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 16 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const isUser = item.role === "user";
          return (
            <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
              {!isUser && (
                <View style={[styles.avatar, { backgroundColor: C.primary + "18" }]}>
                  <Ionicons name="hardware-chip-outline" size={16} color={C.primary} />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  isUser ? { backgroundColor: C.primary } : { backgroundColor: C.surface },
                  { maxWidth: "80%" },
                ]}
              >
                <Text style={{ color: isUser ? "#fff" : C.text, fontSize: 14, lineHeight: 22 }}>
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          loading ? (
            <View style={[styles.row, styles.rowLeft]}>
              <View style={[styles.avatar, { backgroundColor: C.primary + "18" }]}>
                <Ionicons name="hardware-chip-outline" size={16} color={C.primary} />
              </View>
              <View style={[styles.bubble, { backgroundColor: C.surface, flexDirection: "row", gap: 4 }]}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={{ color: C.subtext, fontSize: 13 }}>생각 중...</Text>
              </View>
            </View>
          ) : null
        }
      />

      <View style={[styles.inputBar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: C.bg, color: C.text, borderColor: C.border }]}
          value={text}
          onChangeText={setText}
          placeholder="무엇이든 물어보세요..."
          placeholderTextColor={C.subtext}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: text.trim() && !loading ? C.primary : C.border }]}
          onPress={sendMessage}
          disabled={!text.trim() || loading}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  rowLeft: { alignSelf: "flex-start" },
  rowRight: { alignSelf: "flex-end" },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", padding: 8, gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 100,
  },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
});
