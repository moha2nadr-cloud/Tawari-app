/*  screens/HomeScreen.js  —  الشاشة الرئيسية  */
import React, { useContext, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppCtx } from '../App';

const C = {
  bg     : '#080d1a',
  card   : '#0d1321',
  border : '#1a2235',
  accent : '#f59e0b',
  danger : '#dc2626',
  success: '#16a34a',
  blue   : '#1d4ed8',
  text   : '#e2e8f0',
  muted  : '#6b7280',
  dim    : '#1f2937',
};

export default function HomeScreen() {
  const { node, connected, refresh } = useContext(AppCtx);
  const nav    = useNavigation();
  const scale  = useRef(new Animated.Value(1)).current;
  const ring   = useRef(new Animated.Value(1)).current;

  // نبضة الزر عند الاتصال
  useEffect(() => {
    if (connected) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.06, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.00, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      const ripple = Animated.loop(
        Animated.sequence([
          Animated.timing(ring, { toValue: 1.35, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(ring, { toValue: 1.00, duration: 0,    useNativeDriver: true }),
        ])
      );
      pulse.start();
      ripple.start();
      return () => { pulse.stop(); ripple.stop(); };
    }
  }, [connected]);

  const go = (tab, params) => connected && nav.navigate(tab, params);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── رأس الصفحة ── */}
        <View style={s.hdr}>
          <Text style={s.hdrTitle}>طوارئ القرية 🆘</Text>
          <View style={[s.badge, connected ? s.badgeOn : s.badgeOff]}>
            <View style={[s.dot, { backgroundColor: connected ? '#22c55e' : '#ef4444' }]} />
            <Text style={[s.badgeTxt, { color: connected ? '#86efac' : '#fca5a5' }]}>
              {connected ? 'متصل' : 'غير متصل'}
            </Text>
          </View>
        </View>

        {/* ── معلومات العقدة ── */}
        {connected && node ? (
          <View style={s.nodeCard}>
            <Text style={s.nodeLbl}>🔗 النقطة المتصلة</Text>
            <Text style={s.nodeName}>{node.node}</Text>
            <Text style={s.nodeSub}>القرية {node.village}  |  {node.parent}  |  v{node.fw}</Text>
            {node.blocked && (
              <View style={s.blockedRow}>
                <Text style={s.blockedTxt}>⚠️  الشبكة محظورة مؤقتاً — لا يمكن إرسال بلاغات الآن</Text>
              </View>
            )}
          </View>
        ) : !connected && (
          <View style={s.offCard}>
            <Text style={s.offIcon}>📡</Text>
            <Text style={s.offTitle}>غير متصل بشبكة طوارئ</Text>
            <Text style={s.offSub}>
              اذهب إلى إعدادات Wi-Fi واختر إحدى شبكات الطوارئ:{'\n\n'}
              {'  '}Tawari-Qarya-A{'\n'}
              {'  '}Tawari-Qarya-A2{'\n'}
              {'  '}Tawari-Qarya-B{'\n'}
              {'  '}Tawari-Qarya-B2
            </Text>
            <TouchableOpacity style={s.retryBtn} onPress={refresh}>
              <Text style={s.retryTxt}>🔄  إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── زر SOS ── */}
        <View style={s.sosArea}>
          <View style={s.sosOuter}>
            {/* حلقة خارجية متوسعة */}
            {connected && (
              <Animated.View
                style={[
                  s.sosRing,
                  { transform: [{ scale: ring }], opacity: ring.interpolate({ inputRange: [1, 1.35], outputRange: [0.5, 0] }) },
                ]}
              />
            )}
            <Animated.View style={{ transform: [{ scale }] }}>
              <TouchableOpacity
                style={[s.sosBtn, !connected && s.sosBtnDis]}
                onPress={() => go('بلاغ')}
                activeOpacity={0.75}
                disabled={!connected}
              >
                <Text style={s.sosBig}>🆘</Text>
                <Text style={s.sosTxt}>إرسال بلاغ طوارئ</Text>
                <Text style={s.sosSub}>{connected ? 'اضغط هنا للإبلاغ عن حالة طوارئ' : 'يتطلب الاتصال بالشبكة'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* ── الأزرار السريعة ── */}
        <Text style={s.secTitle}>الخدمات المتاحة</Text>
        <View style={s.grid}>
          {[
            { icon: '📋', label: 'تعليمات\nالسلامة',    tab: 'محتوى',  params: { tab: 'instruction' } },
            { icon: '⛺', label: 'ملاجئ\nونقاط تجمع',   tab: 'محتوى',  params: { tab: 'shelter'     } },
            { icon: '🛡️', label: 'إرشادات\nالأمان',     tab: 'محتوى',  params: { tab: 'safety'      } },
            { icon: '💬', label: 'التواصل\nmع العملاء',  tab: 'تواصل',  params: {}                    },
          ].map((btn, i) => (
            <TouchableOpacity
              key={i}
              style={[s.gridBtn, !connected && s.gridBtnDis]}
              onPress={() => go(btn.tab, btn.params)}
              activeOpacity={0.7}
              disabled={!connected}
            >
              <Text style={s.gridIcon}>{btn.icon}</Text>
              <Text style={s.gridLbl}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── تذييل ── */}
        <Text style={s.footer}>
          {connected
            ? `متصل بـ ${node?.node || 'شبكة الطوارئ'}`
            : 'قم بالاتصال بشبكة Wi-Fi الطوارئ للاستخدام'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe  : { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 20 },

  // Header
  hdr     : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 10 },
  hdrTitle: { fontSize: 19, fontWeight: 'bold', color: C.text },
  badge   : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeOn : { backgroundColor: '#052e16' },
  badgeOff: { backgroundColor: '#3f0000' },
  dot     : { width: 8, height: 8, borderRadius: 4, marginLeft: 5 },
  badgeTxt: { fontSize: 12, fontWeight: 'bold' },

  // Node Card
  nodeCard  : { marginHorizontal: 14, marginBottom: 6, padding: 14, backgroundColor: '#060e1c', borderWidth: 1, borderColor: '#1e3a5f', borderRightWidth: 3, borderRightColor: '#2563eb' },
  nodeLbl   : { fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 4 },
  nodeName  : { fontSize: 15, fontWeight: 'bold', color: '#93c5fd' },
  nodeSub   : { fontSize: 11, color: C.muted, marginTop: 3 },
  blockedRow: { marginTop: 8, backgroundColor: '#450a0a', padding: 8, borderRadius: 4 },
  blockedTxt: { color: '#fca5a5', fontSize: 12, fontWeight: 'bold' },

  // Offline Card
  offCard : { marginHorizontal: 14, marginBottom: 6, padding: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  offIcon : { fontSize: 44 },
  offTitle: { fontSize: 15, fontWeight: 'bold', color: C.text, marginTop: 10 },
  offSub  : { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  retryBtn: { marginTop: 16, backgroundColor: C.dim, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 6, borderWidth: 1, borderColor: '#374151' },
  retryTxt: { color: '#9ca3af', fontWeight: 'bold', fontSize: 13 },

  // SOS Button
  sosArea : { alignItems: 'center', paddingVertical: 20 },
  sosOuter: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  sosRing : { position: 'absolute', width: 174, height: 174, borderRadius: 87, borderWidth: 2, borderColor: C.danger },
  sosBtn  : { width: 170, height: 170, borderRadius: 85, backgroundColor: C.danger, alignItems: 'center', justifyContent: 'center', elevation: 12, shadowColor: C.danger, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 18 },
  sosBtnDis: { backgroundColor: '#374151', elevation: 0, shadowOpacity: 0 },
  sosBig  : { fontSize: 42 },
  sosTxt  : { color: '#fff', fontWeight: 'bold', fontSize: 14, marginTop: 5 },
  sosSub  : { color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 3, textAlign: 'center', paddingHorizontal: 12 },

  // Quick Grid
  secTitle: { fontSize: 11, color: C.muted, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 },
  grid    : { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  gridBtn : { width: '48%', margin: '1%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 18, alignItems: 'center' },
  gridBtnDis: { opacity: 0.4 },
  gridIcon: { fontSize: 30 },
  gridLbl : { color: C.muted, fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 8, lineHeight: 18 },

  // Footer
  footer: { fontSize: 11, color: '#1f2937', textAlign: 'center', marginTop: 14, paddingHorizontal: 20 },
});
