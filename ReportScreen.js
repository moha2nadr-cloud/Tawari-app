/*  screens/ReportScreen.js  —  إرسال بلاغ طوارئ  */
import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { AppCtx } from '../App';
import { sendReport } from '../api';

const C = {
  bg    : '#080d1a',
  card  : '#0d1321',
  border: '#1a2235',
  danger: '#dc2626',
  text  : '#e2e8f0',
  muted : '#6b7280',
  input : '#060c18',
  focus : '#f59e0b',
};

const TYPES = [
  { id: 'SOS',      label: 'طوارئ عامة',   icon: '🆘', color: '#dc2626' },
  { id: 'fire',     label: 'حريق',          icon: '🔥', color: '#ea580c' },
  { id: 'medical',  label: 'إسعاف طبي',    icon: '🏥', color: '#16a34a' },
  { id: 'security', label: 'أمني',          icon: '🚨', color: '#7c3aed' },
  { id: 'missing',  label: 'شخص مفقود',    icon: '👤', color: '#0891b2' },
  { id: 'other',    label: 'أخرى',          icon: '📍', color: '#4b5563' },
];

export default function ReportScreen() {
  const { connected, node } = useContext(AppCtx);

  const [type,     setType]     = useState('SOS');
  const [loc,      setLoc]      = useState('');
  const [note,     setNote]     = useState('');
  const [lat,      setLat]      = useState('');
  const [lon,      setLon]      = useState('');
  const [gpsState, setGpsState] = useState('idle');   // idle | loading | ok | fail
  const [sending,  setSending]  = useState(false);
  const [result,   setResult]   = useState(null);     // null | {ok,id,synced} | {ok:false}

  // جلب الموقع عند فتح الشاشة
  useEffect(() => {
    grabLocation();
  }, []);

  const grabLocation = async () => {
    setGpsState('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsState('fail'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLat(pos.coords.latitude.toFixed(6));
      setLon(pos.coords.longitude.toFixed(6));
      setGpsState('ok');
    } catch { setGpsState('fail'); }
  };

  const submit = async () => {
    if (!connected) {
      Alert.alert('غير متصل', 'يجب الاتصال بشبكة الطوارئ أولاً');
      return;
    }
    if (node?.blocked) {
      Alert.alert('الشبكة محظورة', 'الشبكة محظورة مؤقتاً، يرجى المحاولة لاحقاً');
      return;
    }

    setSending(true);
    setResult(null);
    const res = await sendReport({ type, loc: loc || `${lat},${lon}`, note, lat, lon });
    setResult(res);
    setSending(false);

    if (res?.ok) {
      // مسح النموذج بعد النجاح
      setTimeout(() => {
        setNote('');
        setLoc('');
        setResult(null);
      }, 8000);
    }
  };

  const reset = () => { setNote(''); setLoc(''); setResult(null); };

  const selType = TYPES.find(t => t.id === type) || TYPES[0];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── رأس الصفحة ── */}
        <View style={s.hdr}>
          <Text style={s.hdrTitle}>🆘 إرسال بلاغ طوارئ</Text>
          {!connected && (
            <View style={s.offBadge}>
              <Text style={s.offTxt}>غير متصل</Text>
            </View>
          )}
        </View>

        {/* ── تنبيه غير متصل ── */}
        {!connected && (
          <View style={s.offBanner}>
            <Text style={s.offBannerTxt}>
              📡  يجب الاتصال بشبكة الطوارئ أولاً لإرسال البلاغات
            </Text>
          </View>
        )}

        {/* ── نتيجة الإرسال ── */}
        {result && (
          <View style={[s.resultCard, result.ok ? s.resultOk : s.resultFail]}>
            {result.ok ? (
              <>
                <Text style={s.resultIcon}>✅</Text>
                <Text style={s.resultTitle}>تم إرسال البلاغ!</Text>
                <Text style={s.resultSub}>رقم البلاغ: #{result.id}</Text>
                <Text style={s.resultSub}>
                  {result.synced ? '✔ وصل لمركز القرية' : '⏳ محفوظ - سيُرسَل عند عودة الاتصال'}
                </Text>
                <TouchableOpacity style={s.newBtn} onPress={reset}>
                  <Text style={s.newBtnTxt}>بلاغ جديد</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.resultIcon}>❌</Text>
                <Text style={s.resultTitle}>فشل الإرسال</Text>
                <Text style={s.resultSub}>تأكد من الاتصال بالشبكة وأعد المحاولة</Text>
                <TouchableOpacity style={s.newBtn} onPress={() => setResult(null)}>
                  <Text style={s.newBtnTxt}>إعادة المحاولة</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ── نموذج البلاغ ── */}
        {!result && (
          <View style={s.form}>

            {/* اختيار النوع */}
            <Text style={s.label}>نوع البلاغ</Text>
            <View style={s.typesGrid}>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[s.typeBtn, type === t.id && { ...s.typeBtnSel, borderColor: t.color }]}
                  onPress={() => setType(t.id)}
                >
                  <Text style={s.typeIcon}>{t.icon}</Text>
                  <Text style={[s.typeLbl, type === t.id && { color: t.color }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* الموقع GPS */}
            <Text style={s.label}>الموقع الجغرافي</Text>
            <View style={s.gpsRow}>
              <View style={[s.gpsBadge,
                gpsState === 'ok'      && s.gpsOk,
                gpsState === 'loading' && s.gpsLoading,
                gpsState === 'fail'    && s.gpsFail,
              ]}>
                {gpsState === 'loading'
                  ? <ActivityIndicator size="small" color="#f59e0b" />
                  : <Text style={s.gpsIcon}>
                      {gpsState === 'ok' ? '📍 تم التحديد' : gpsState === 'fail' ? '📍 غير متاح' : '📍 غير محدد'}
                    </Text>
                }
                {gpsState === 'ok' && lat && (
                  <Text style={s.gpsCoords}>{lat}, {lon}</Text>
                )}
              </View>
              <TouchableOpacity style={s.gpsBtn} onPress={grabLocation}>
                <Text style={s.gpsBtnTxt}>🔄 تحديث</Text>
              </TouchableOpacity>
            </View>

            {/* موقع نصي (اختياري) */}
            <Text style={s.label}>وصف الموقع <Text style={s.optional}>(اختياري)</Text></Text>
            <TextInput
              style={s.input}
              value={loc}
              onChangeText={setLoc}
              placeholder="مثال: بالقرب من المسجد، شارع الرئيسي..."
              placeholderTextColor="#374151"
              multiline
            />

            {/* ملاحظة */}
            <Text style={s.label}>ملاحظات إضافية <Text style={s.optional}>(اختياري)</Text></Text>
            <TextInput
              style={[s.input, { minHeight: 80 }]}
              value={note}
              onChangeText={setNote}
              placeholder="صف الموقف بإيجاز..."
              placeholderTextColor="#374151"
              multiline
              textAlignVertical="top"
            />

            {/* ملخص البلاغ */}
            <View style={s.summary}>
              <Text style={s.summaryTxt}>
                {selType.icon}  بلاغ: {selType.label}
                {gpsState === 'ok' ? `  •  📍 GPS محدد` : '  •  📍 بدون GPS'}
              </Text>
            </View>

            {/* زر الإرسال */}
            <TouchableOpacity
              style={[s.sendBtn, (!connected || sending) && s.sendBtnDis]}
              onPress={submit}
              activeOpacity={0.8}
              disabled={!connected || sending}
            >
              {sending
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.sendBtnTxt}>إرسال البلاغ الآن  🆘</Text>
              }
            </TouchableOpacity>

            <Text style={s.disclaimer}>
              سيُرسَل بلاغك مباشرة لمركز القرية وسيُتعامل معه فوراً.
              في حالات الخطر الشديد اتصل بالمسعفين المباشرين.
            </Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe : { flex: 1, backgroundColor: C.bg },
  hdr  : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  hdrTitle: { fontSize: 18, fontWeight: 'bold', color: C.text },
  offBadge: { backgroundColor: '#450a0a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  offTxt  : { color: '#fca5a5', fontSize: 11, fontWeight: 'bold' },
  offBanner: { marginHorizontal: 14, marginBottom: 8, backgroundColor: '#450a0a', borderWidth: 1, borderColor: '#7f1d1d', padding: 12, borderRadius: 6 },
  offBannerTxt: { color: '#fca5a5', fontSize: 13, fontWeight: 'bold' },

  // Result
  resultCard : { marginHorizontal: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderRadius: 8, marginBottom: 10 },
  resultOk   : { backgroundColor: '#052e16', borderColor: '#166534' },
  resultFail : { backgroundColor: '#3f0000', borderColor: '#7f1d1d' },
  resultIcon : { fontSize: 44 },
  resultTitle: { fontSize: 17, fontWeight: 'bold', color: C.text, marginTop: 10 },
  resultSub  : { fontSize: 13, color: C.muted, marginTop: 6, textAlign: 'center' },
  newBtn     : { marginTop: 16, backgroundColor: '#1f2937', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 6, borderWidth: 1, borderColor: '#374151' },
  newBtnTxt  : { color: '#9ca3af', fontWeight: 'bold', fontSize: 13 },

  // Form
  form  : { paddingHorizontal: 14 },
  label : { fontSize: 12, fontWeight: 'bold', color: '#9ca3af', marginBottom: 8, marginTop: 16, letterSpacing: 0.5 },
  optional: { fontWeight: 'normal', color: '#4b5563' },

  // Type Buttons
  typesGrid  : { flexDirection: 'row', flexWrap: 'wrap' },
  typeBtn    : { width: '31%', margin: '1%', padding: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', borderRadius: 6 },
  typeBtnSel : { backgroundColor: '#0a0f1e', borderWidth: 2 },
  typeIcon   : { fontSize: 26 },
  typeLbl    : { fontSize: 11, color: C.muted, marginTop: 5, fontWeight: 'bold', textAlign: 'center' },

  // GPS
  gpsRow     : { flexDirection: 'row', alignItems: 'center' },
  gpsBadge   : { flex: 1, padding: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 6, marginLeft: 8 },
  gpsOk      : { borderColor: '#166534', backgroundColor: '#052e16' },
  gpsLoading : { borderColor: '#78350f', backgroundColor: '#0a0800' },
  gpsFail    : { borderColor: '#7f1d1d', backgroundColor: '#0f0202' },
  gpsIcon    : { fontSize: 13, color: C.muted },
  gpsCoords  : { fontSize: 11, color: '#86efac', marginTop: 3 },
  gpsBtn     : { backgroundColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 6, borderWidth: 1, borderColor: '#374151' },
  gpsBtnTxt  : { color: '#9ca3af', fontSize: 12, fontWeight: 'bold' },

  // Input
  input: { backgroundColor: C.input, borderWidth: 1, borderColor: C.border, color: C.text, padding: 12, fontSize: 14, borderRadius: 6, textAlign: 'right' },

  // Summary
  summary   : { marginTop: 16, backgroundColor: '#060c18', borderWidth: 1, borderColor: '#1a2235', borderRightWidth: 3, borderRightColor: '#f59e0b', padding: 12, borderRadius: 4 },
  summaryTxt: { color: '#e2e8f0', fontSize: 13, fontWeight: 'bold' },

  // Send Button
  sendBtn   : { marginTop: 18, backgroundColor: C.danger, padding: 16, alignItems: 'center', borderRadius: 8, elevation: 6, shadowColor: C.danger, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 8 },
  sendBtnDis: { backgroundColor: '#374151', elevation: 0, shadowOpacity: 0 },
  sendBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },

  disclaimer: { fontSize: 11, color: '#374151', textAlign: 'center', marginTop: 14, lineHeight: 17, paddingHorizontal: 10 },
});
