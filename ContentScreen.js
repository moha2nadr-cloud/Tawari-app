/*  screens/ContentScreen.js  —  المحتوى (ارشادات / ملاجئ / تعليمات / أسئلة)  */
import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { AppCtx } from '../App';
import { getContent } from '../api';

// تفعيل Animation على Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental)
  UIManager.setLayoutAnimationEnabledExperimental(true);

const C = {
  bg    : '#080d1a',
  card  : '#0d1321',
  border: '#1a2235',
  accent: '#f59e0b',
  text  : '#e2e8f0',
  muted : '#6b7280',
};

const TABS = [
  { id: 'instruction', label: 'تعليمات',    icon: '📋' },
  { id: 'safety',      label: 'إرشادات',    icon: '🛡️' },
  { id: 'shelter',     label: 'ملاجئ',      icon: '⛺' },
  { id: 'faq',         label: 'أسئلة',      icon: '❓' },
];

const SHELTER_COLORS = {
  available  : { bg: '#052e16', border: '#166534', text: '#86efac', label: 'متاح ✅' },
  full       : { bg: '#3f0000', border: '#7f1d1d', text: '#fca5a5', label: 'ممتلئ ❌' },
  unavailable: { bg: '#1c0a00', border: '#7c2d12', text: '#fdba74', label: 'غير متاح ⚠️' },
};

function ContentCard({ item, isShelter }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  const sc = isShelter && SHELTER_COLORS[item.extra] || null;

  return (
    <TouchableOpacity style={s.card} onPress={toggle} activeOpacity={0.8}>
      <View style={s.cardHdr}>
        <View style={s.cardTitleRow}>
          <Text style={s.cardTitle}>{item.title}</Text>
          {sc && (
            <View style={[s.shelterBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
              <Text style={[s.shelterTxt, { color: sc.text }]}>{sc.label}</Text>
            </View>
          )}
        </View>
        <Text style={s.cardArrow}>{open ? '▲' : '▼'}</Text>
      </View>
      {open && (
        <View style={s.cardBody}>
          <Text style={s.cardBodyTxt}>{item.body}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ContentScreen() {
  const { connected } = useContext(AppCtx);
  const route = useRoute();

  const [activeTab,  setActiveTab]  = useState(route.params?.tab || 'instruction');
  const [content,    setContent]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cached,     setCached]     = useState({});
  const [lastFetch,  setLastFetch]  = useState(0);

  const fetchData = useCallback(async (force = false) => {
    if (!connected) return;
    if (!force && Date.now() - lastFetch < 30000 && cached[activeTab]) {
      setContent(cached[activeTab]);
      return;
    }
    setLoading(true);
    const all = await getContent();
    // تخزين مؤقت حسب النوع
    const grouped = {};
    TABS.forEach(t => { grouped[t.id] = all.filter(c => c.kind === t.id); });
    setCached(grouped);
    setContent(grouped[activeTab] || []);
    setLastFetch(Date.now());
    setLoading(false);
  }, [connected, activeTab, lastFetch, cached]);

  useEffect(() => { fetchData(); }, [connected]);
  useEffect(() => {
    if (cached[activeTab]) setContent(cached[activeTab]);
    else if (connected) fetchData(true);
  }, [activeTab]);

  // تحديث من navigation params
  useEffect(() => {
    if (route.params?.tab) setActiveTab(route.params.tab);
  }, [route.params?.tab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  const tabItems = content.filter(c => c.kind === activeTab);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── رأس الصفحة ── */}
      <View style={s.hdr}>
        <Text style={s.hdrTitle}>📋  المحتوى والإرشادات</Text>
        {!connected && <Text style={s.offTag}>غير متصل</Text>}
      </View>

      {/* ── التبويبات ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsBar}>
        {TABS.map(t => {
          const count = cached[t.id]?.length || 0;
          const active = t.id === activeTab;
          return (
            <TouchableOpacity
              key={t.id}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setActiveTab(t.id)}
            >
              <Text style={s.tabIcon}>{t.icon}</Text>
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{t.label}</Text>
              {count > 0 && (
                <View style={[s.tabBadge, active && s.tabBadgeActive]}>
                  <Text style={[s.tabBadgeTxt, active && { color: C.bg }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── المحتوى ── */}
      <ScrollView
        style={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
      >
        {!connected ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📡</Text>
            <Text style={s.emptyTxt}>اتصل بشبكة الطوارئ لعرض المحتوى</Text>
          </View>
        ) : loading ? (
          <View style={s.loading}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={s.loadingTxt}>جاري تحميل المحتوى...</Text>
          </View>
        ) : tabItems.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📂</Text>
            <Text style={s.emptyTxt}>لا يوجد محتوى في هذا القسم حالياً</Text>
            <Text style={s.emptySub}>اسحب للأسفل لتحديث المحتوى</Text>
          </View>
        ) : (
          <View style={{ padding: 12 }}>
            {tabItems.map((item, i) => (
              <ContentCard
                key={`${activeTab}-${i}`}
                item={item}
                isShelter={activeTab === 'shelter'}
              />
            ))}
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe : { flex: 1, backgroundColor: C.bg },
  hdr  : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  hdrTitle: { fontSize: 18, fontWeight: 'bold', color: C.text },
  offTag: { color: '#fca5a5', fontSize: 11, fontWeight: 'bold', backgroundColor: '#450a0a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },

  // Tabs
  tabsBar    : { flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 10, maxHeight: 60 },
  tab        : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, marginLeft: 6, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabActive  : { backgroundColor: '#1a1200', borderColor: C.accent },
  tabIcon    : { fontSize: 15, marginLeft: 5 },
  tabLabel   : { fontSize: 12, fontWeight: 'bold', color: C.muted },
  tabLabelActive: { color: C.accent },
  tabBadge   : { backgroundColor: '#374151', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  tabBadgeActive: { backgroundColor: C.accent },
  tabBadgeTxt: { fontSize: 10, fontWeight: 'bold', color: C.muted },

  // Scroll
  scroll: { flex: 1 },

  // Card
  card       : { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRightWidth: 3, borderRightColor: C.accent, marginBottom: 10, borderRadius: 4 },
  cardHdr    : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14 },
  cardTitleRow: { flex: 1, marginLeft: 10 },
  cardTitle  : { fontSize: 14, fontWeight: 'bold', color: C.text, lineHeight: 20 },
  cardArrow  : { color: C.muted, fontSize: 12, paddingTop: 2 },
  cardBody   : { paddingHorizontal: 14, paddingBottom: 14 },
  cardBodyTxt: { fontSize: 13, color: '#9ca3af', lineHeight: 21 },

  // Shelter Badge
  shelterBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1, marginTop: 5, alignSelf: 'flex-start' },
  shelterTxt  : { fontSize: 11, fontWeight: 'bold' },

  // Empty / Loading
  empty     : { padding: 48, alignItems: 'center' },
  emptyIcon : { fontSize: 44 },
  emptyTxt  : { fontSize: 14, color: C.muted, marginTop: 14, textAlign: 'center' },
  emptySub  : { fontSize: 12, color: '#374151', marginTop: 6 },
  loading   : { padding: 48, alignItems: 'center' },
  loadingTxt: { color: C.muted, marginTop: 14, fontSize: 13 },
});
