/*  screens/ChatScreen.js  —  التواصل مع عملاء الطوارئ  */
import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppCtx } from '../App';
import { getAgents, getChatMsgs, sendChatMsg } from '../api';

const C = {
  bg      : '#080d1a',
  chatBg  : '#04080f',
  card    : '#0d1321',
  border  : '#1a2235',
  accent  : '#f59e0b',
  danger  : '#dc2626',
  success : '#16a34a',
  text    : '#e2e8f0',
  muted   : '#6b7280',
  myMsg   : '#052e16',
  myBorder: '#166534',
  myText  : '#86efac',
  theirMsg  : '#04121a',
  theirBorder: '#0a4a6a',
  theirText  : '#67e8f9',
  inputBg : '#06090f',
};

const POLL_MS = 4000;

export default function ChatScreen() {
  const { connected, node, deviceId } = useContext(AppCtx);

  const [agents,      setAgents]      = useState([]);
  const [selAgent,    setSelAgent]    = useState(null);
  const [userName,    setUserName]    = useState('');
  const [nameInput,   setNameInput]   = useState('');
  const [msgs,        setMsgs]        = useState([]);
  const [text,        setText]        = useState('');
  const [sending,     setSending]     = useState(false);
  const [loadAgents,  setLoadAgents]  = useState(false);
  const [offline,     setOffline]     = useState(false);
  const [sessionId,   setSessionId]   = useState('');

  const flatRef   = useRef(null);
  const pollRef   = useRef(null);
  const msgCount  = useRef(0);

  // جلب قائمة العملاء
  const fetchAgents = useCallback(async () => {
    if (!connected) return;
    setLoadAgents(true);
    const list = await getAgents();
    setAgents(list);
    setLoadAgents(false);
  }, [connected]);

  useEffect(() => { fetchAgents(); }, [connected]);

  // بناء session ID
  useEffect(() => {
    if (node && selAgent && userName) {
      // صيغة تتوافق مع كود ESP: NODE_NAME_agentName_deviceId
      const sid = `${node.node}_${selAgent.name}_${deviceId}`;
      setSessionId(sid);
      setMsgs([]);
      msgCount.current = 0;
    }
  }, [node, selAgent, userName, deviceId]);

  // Polling الرسائل
  useEffect(() => {
    if (!sessionId || !connected) return;
    // تحميل أولي
    loadMsgs();
    pollRef.current = setInterval(loadMsgs, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [sessionId, connected]);

  const loadMsgs = async () => {
    if (!sessionId) return;
    const data = await getChatMsgs(sessionId);
    if (data.length > msgCount.current) {
      setMsgs(data);
      msgCount.current = data.length;
      setOffline(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } else if (data.length === 0 && msgCount.current > 0) {
      // لم يرجع شيء — ربما انقطع الاتصال
      setOffline(true);
    }
  };

  const enterChat = () => {
    const n = nameInput.trim();
    if (!n) { Alert.alert('تنبيه', 'يرجى إدخال اسمك أولاً'); return; }
    setUserName(n);
  };

  const send = async () => {
    const t = text.trim();
    if (!t || !sessionId || !connected) return;

    // عرض فوري
    const optimistic = { from: userName, text: t };
    setMsgs(prev => [...prev, optimistic]);
    msgCount.current++;
    setText('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);

    setSending(true);
    const res = await sendChatMsg({ session: sessionId, from: userName, text: t });
    setSending(false);
    if (!res?.ok) setOffline(true);
    else setOffline(false);
  };

  // ── قبل دخول المحادثة: اختيار عميل ────────────────────
  if (!selAgent) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.hdr}>
          <Text style={s.hdrTitle}>💬  التواصل مع العملاء</Text>
          {!connected && <Text style={s.offTag}>غير متصل</Text>}
        </View>

        {!connected ? (
          <View style={s.center}>
            <Text style={{ fontSize: 44 }}>📡</Text>
            <Text style={s.centerTxt}>اتصل بشبكة الطوارئ أولاً</Text>
          </View>
        ) : loadAgents ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={s.centerTxt}>تحميل قائمة العملاء...</Text>
          </View>
        ) : agents.length === 0 ? (
          <View style={s.center}>
            <Text style={{ fontSize: 44 }}>😴</Text>
            <Text style={s.centerTxt}>لا يوجد عملاء متاحون الآن</Text>
            <TouchableOpacity style={s.retryBtn} onPress={fetchAgents}>
              <Text style={s.retryTxt}>🔄  تحديث</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.agentsList}>
            <Text style={s.agentsHint}>اختر عميل طوارئ للتواصل معه</Text>
            {agents.map((ag, i) => (
              <TouchableOpacity
                key={i}
                style={[s.agentCard, ag.status !== 'متاح' && s.agentBusy]}
                onPress={() => ag.status === 'متاح' && setSelAgent(ag)}
                activeOpacity={0.7}
              >
                <View style={s.agentInfo}>
                  <Text style={s.agentIcon}>👤</Text>
                  <View>
                    <Text style={s.agentName}>{ag.name}</Text>
                    <Text style={[s.agentStatus, ag.status === 'متاح' ? s.statusOk : s.statusBusy]}>
                      {ag.status === 'متاح' ? '🟢 متاح الآن' : '🔴 مشغول حالياً'}
                    </Text>
                  </View>
                </View>
                <Text style={s.agentArrow}>{ag.status === 'متاح' ? '← تواصل' : '...'}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.refreshRow} onPress={fetchAgents}>
              <Text style={s.refreshTxt}>🔄  تحديث القائمة</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── طلب اسم المستخدم ──────────────────────────────────
  if (!userName) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.hdr}>
          <TouchableOpacity onPress={() => setSelAgent(null)} style={s.backBtn}>
            <Text style={s.backTxt}>→ رجوع</Text>
          </TouchableOpacity>
          <Text style={s.hdrTitle}>التواصل مع {selAgent.name}</Text>
        </View>
        <View style={s.nameWrap}>
          <Text style={s.nameIcon}>💬</Text>
          <Text style={s.nameTitle}>أدخل اسمك للدخول</Text>
          <Text style={s.nameSub}>يُستخدم اسمك لتعريفك عند عميل الطوارئ</Text>
          <TextInput
            style={s.nameInput}
            placeholder="الاسم"
            placeholderTextColor="#374151"
            value={nameInput}
            onChangeText={setNameInput}
            returnKeyType="done"
            onSubmitEditing={enterChat}
            autoFocus
          />
          <TouchableOpacity style={s.enterBtn} onPress={enterChat}>
            <Text style={s.enterBtnTxt}>دخول المحادثة  💬</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── شاشة المحادثة ──────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={s.chatHdr}>
          <TouchableOpacity onPress={() => setUserName('')} style={s.backBtn}>
            <Text style={s.backTxtLight}>→</Text>
          </TouchableOpacity>
          <View style={s.agentMini}>
            <Text style={s.agentMiniIcon}>👤</Text>
            <View>
              <Text style={s.agentMiniName}>{selAgent.name}</Text>
              <Text style={s.agentMiniSub}>عميل طوارئ</Text>
            </View>
          </View>
          {offline && <Text style={s.offlineIndicator}>📡 انقطع</Text>}
        </View>

        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={msgs}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={s.msgList}
          style={{ backgroundColor: C.chatBg, flex: 1 }}
          ListEmptyComponent={
            <View style={s.emptyChat}>
              <Text style={{ fontSize: 36 }}>💬</Text>
              <Text style={s.emptyChatTxt}>ابدأ المحادثة مع {selAgent.name}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.from === userName;
            return (
              <View style={[s.msgBubble, mine ? s.mine : s.theirs]}>
                {!mine && <Text style={s.msgFrom}>{item.from}</Text>}
                <Text style={[s.msgText, mine ? s.mineText : s.theirsText]}>
                  {item.text}
                </Text>
              </View>
            );
          }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input */}
        <View style={[s.inputRow, offline && s.inputRowOffline]}>
          {offline && (
            <View style={s.offlineBanner}>
              <Text style={s.offlineTxt}>📡  الشبكة مقطوعة — رسائلك لن تصل</Text>
            </View>
          )}
          <View style={s.inputWrap}>
            <TextInput
              style={s.textInput}
              value={text}
              onChangeText={setText}
              placeholder="اكتب رسالة..."
              placeholderTextColor="#2d3a50"
              returnKeyType="send"
              onSubmitEditing={send}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDis]}
              onPress={send}
              disabled={!text.trim() || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.sendBtnTxt}>▶</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe  : { flex: 1, backgroundColor: C.bg },
  hdr   : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  hdrTitle: { fontSize: 17, fontWeight: 'bold', color: C.text },
  offTag: { color: '#fca5a5', fontSize: 11, fontWeight: 'bold', backgroundColor: '#450a0a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  centerTxt: { color: C.muted, fontSize: 14, marginTop: 14, textAlign: 'center' },
  retryBtn: { marginTop: 20, backgroundColor: '#1f2937', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 6 },
  retryTxt: { color: '#9ca3af', fontWeight: 'bold' },

  // Agents List
  agentsList: { padding: 14 },
  agentsHint: { fontSize: 12, color: C.muted, textAlign: 'center', marginBottom: 14, letterSpacing: 0.5 },
  agentCard : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 10, borderRadius: 8 },
  agentBusy : { opacity: 0.5 },
  agentInfo : { flexDirection: 'row', alignItems: 'center' },
  agentIcon : { fontSize: 28, marginLeft: 12 },
  agentName : { fontSize: 15, fontWeight: 'bold', color: C.text },
  agentStatus: { fontSize: 12, marginTop: 3 },
  statusOk  : { color: '#86efac' },
  statusBusy: { color: '#fca5a5' },
  agentArrow: { color: C.accent, fontSize: 13, fontWeight: 'bold' },
  refreshRow: { alignItems: 'center', marginTop: 10 },
  refreshTxt: { color: '#374151', fontSize: 13 },

  // Name Entry
  nameWrap  : { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  nameIcon  : { fontSize: 48 },
  nameTitle : { fontSize: 18, fontWeight: 'bold', color: C.text, marginTop: 12 },
  nameSub   : { fontSize: 12, color: C.muted, marginTop: 6, textAlign: 'center' },
  nameInput : { width: '100%', backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border, color: C.text, padding: 14, fontSize: 15, borderRadius: 8, marginTop: 20, textAlign: 'right' },
  enterBtn  : { width: '100%', backgroundColor: C.success, padding: 15, alignItems: 'center', borderRadius: 8, marginTop: 14, elevation: 4 },
  enterBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  backBtn   : { paddingVertical: 4, paddingHorizontal: 6 },
  backTxt   : { color: C.accent, fontSize: 13, fontWeight: 'bold' },

  // Chat Header
  chatHdr      : { flexDirection: 'row', alignItems: 'center', backgroundColor: '#03060e', borderBottomWidth: 1, borderBottomColor: '#0a1820', padding: 12 },
  backTxtLight : { color: '#0ea5c9', fontSize: 18, fontWeight: 'bold', paddingLeft: 8 },
  agentMini    : { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  agentMiniIcon: { fontSize: 22, marginLeft: 10 },
  agentMiniName: { fontSize: 14, fontWeight: 'bold', color: '#e0f2fe' },
  agentMiniSub : { fontSize: 11, color: '#0ea5c9' },
  offlineIndicator: { color: '#f87171', fontSize: 11, fontWeight: 'bold' },

  // Messages
  msgList  : { padding: 12, paddingBottom: 6 },
  msgBubble: { maxWidth: '78%', marginBottom: 8, padding: 10, borderRadius: 4 },
  mine     : { alignSelf: 'flex-end', backgroundColor: C.myMsg, borderRightWidth: 3, borderRightColor: '#16a34a' },
  theirs   : { alignSelf: 'flex-start', backgroundColor: C.theirMsg, borderRightWidth: 3, borderRightColor: '#0a4a6a' },
  msgFrom  : { fontSize: 10, color: '#0ea5c9', fontWeight: 'bold', marginBottom: 3 },
  msgText  : { fontSize: 13, lineHeight: 19 },
  mineText : { color: C.myText },
  theirsText: { color: C.theirText },
  emptyChat : { padding: 48, alignItems: 'center' },
  emptyChatTxt: { color: C.muted, marginTop: 12, fontSize: 13, textAlign: 'center' },

  // Input
  inputRow       : { backgroundColor: '#03060e', borderTopWidth: 1, borderTopColor: '#0a1820' },
  inputRowOffline: { borderTopColor: '#7f1d1d' },
  offlineBanner  : { backgroundColor: '#450a0a', padding: 8, alignItems: 'center' },
  offlineTxt     : { color: '#fca5a5', fontSize: 11, fontWeight: 'bold' },
  inputWrap      : { flexDirection: 'row', alignItems: 'center', padding: 8 },
  textInput      : { flex: 1, backgroundColor: C.inputBg, borderWidth: 1, borderColor: '#0a1e2a', color: '#7a9aaa', padding: 10, fontSize: 14, borderRadius: 6, maxHeight: 90, textAlign: 'right' },
  sendBtn        : { width: 42, height: 42, backgroundColor: '#0a4a6a', alignItems: 'center', justifyContent: 'center', borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: '#0ea5c9' },
  sendBtnDis     : { opacity: 0.4 },
  sendBtnTxt     : { color: '#0ea5c9', fontSize: 18, fontWeight: 'bold' },
});
