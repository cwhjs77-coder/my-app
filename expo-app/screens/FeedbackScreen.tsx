import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  useColorScheme, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform,
} from "react-native";
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, serverTimestamp, where,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/lib/firebase";
import { useAuthContext } from "@/context/AuthContext";
import { light, dark } from "@/constants/colors";

const STATUS_LABEL: Record<string, string> = {
  pending: "검토 중",
  in_progress: "처리 중",
  resolved: "완료",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  resolved: "#22c55e",
};

interface Feedback {
  id: string;
  title: string;
  content: string;
  authorName: string;
  status: string;
  adminReply?: string;
  createdAt: Date | null;
}

export default function FeedbackScreen() {
  const scheme = useColorScheme();
  const C = scheme === "dark" ? dark : light;
  const { firebaseUser, userProfile } = useAuthContext();

  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(
      collection(db, "feedback"),
      where("authorId", "==", firebaseUser.uid),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title ?? "",
          content: d.data().content ?? "",
          authorName: d.data().authorName ?? "",
          status: d.data().status ?? "pending",
          adminReply: d.data().adminReply,
          createdAt: d.data().createdAt?.toDate() ?? null,
        }))
      );
      setLoading(false);
    });
  }, [firebaseUser]);

  async function handleSubmit() {
    if (!title.trim() || !content.trim() || !firebaseUser) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        title: title.trim(),
        content: content.trim(),
        authorId: firebaseUser.uid,
        authorName: userProfile?.name ?? "알 수 없음",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setContent("");
      setModalVisible(false);
      Alert.alert("제출 완료", "의견이 등록되었습니다. 검토 후 답변 드리겠습니다.");
    } catch (err) {
      Alert.alert("오류", "등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* 상단 새 글 버튼 */}
      <TouchableOpacity
        style={[styles.writeBtn, { backgroundColor: C.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.writeBtnText}>의견 작성하기</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="chatbox-outline" size={40} color={C.border} />
              <Text style={[styles.emptyText, { color: C.subtext }]}>작성된 의견이 없습니다.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusColor = STATUS_COLOR[item.status] ?? "#64748b";
            return (
              <View style={[styles.card, { backgroundColor: C.surface }]}>
                <View style={styles.cardTop}>
                  <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>{item.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                    <Text style={{ fontSize: 11, color: statusColor, fontWeight: "600" }}>
                      {STATUS_LABEL[item.status] ?? item.status}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.content, { color: C.subtext }]} numberOfLines={2}>{item.content}</Text>
                {item.adminReply && (
                  <View style={[styles.replyBox, { backgroundColor: C.primaryBg, borderColor: C.primary + "30" }]}>
                    <Text style={[styles.replyLabel, { color: C.primary }]}>관리자 답변</Text>
                    <Text style={[styles.replyText, { color: C.text }]}>{item.adminReply}</Text>
                  </View>
                )}
                <Text style={[styles.date, { color: C.subtext }]}>
                  {item.createdAt ? item.createdAt.toLocaleDateString("ko-KR") : ""}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* 작성 모달 */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: C.bg }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modalHeader, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ color: C.subtext, fontSize: 15 }}>취소</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: C.text }]}>의견 작성</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={submitting || !title.trim() || !content.trim()}>
              <Text style={{ color: title.trim() && content.trim() ? C.primary : C.border, fontSize: 15, fontWeight: "600" }}>
                {submitting ? "제출 중..." : "제출"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            <TextInput
              style={[styles.modalInput, { backgroundColor: C.surface, color: C.text, borderColor: C.border }]}
              placeholder="제목을 입력하세요"
              placeholderTextColor={C.subtext}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <TextInput
              style={[styles.modalTextArea, { backgroundColor: C.surface, color: C.text, borderColor: C.border }]}
              placeholder="의견 내용을 자세히 작성해주세요..."
              placeholderTextColor={C.subtext}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  writeBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginHorizontal: 14, marginTop: 14, marginBottom: 4,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignSelf: "flex-start",
  },
  writeBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  card: {
    padding: 14, borderRadius: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 },
  title: { flex: 1, fontSize: 15, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexShrink: 0 },
  content: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  replyBox: { padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  replyLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  replyText: { fontSize: 13, lineHeight: 19 },
  date: { fontSize: 11 },
  emptyBox: { alignItems: "center", marginTop: 60, gap: 10 },
  emptyText: { fontSize: 14 },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 16, fontWeight: "600" },
  modalInput: {
    height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15,
  },
  modalTextArea: {
    height: 200, borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, lineHeight: 22,
  },
});
