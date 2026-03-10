/*  App.js  —  المدخل الرئيسي للتطبيق
 *  طوارئ القرية | ESP32-S3 Emergency Network Client
 */
import React, { useState, useEffect, createContext, useRef } from 'react';
import { NavigationContainer }          from '@react-navigation/native';
import { createBottomTabNavigator }     from '@react-navigation/bottom-tabs';
import { SafeAreaProvider }             from 'react-native-safe-area-context';
import { StatusBar }                    from 'expo-status-bar';
import {
  I18nManager, View, Text, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';

import HomeScreen    from './screens/HomeScreen';
import ReportScreen  from './screens/ReportScreen';
import ContentScreen from './screens/ContentScreen';
import ChatScreen    from './screens/ChatScreen';
import { getStatus } from './api';

// ── إجبار اتجاه RTL ──────────────────────────────────────
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

// ── Context مشترك ────────────────────────────────────────
export const AppCtx = createContext({
  node      : null,
  connected : false,
  deviceId  : '',
  refresh   : () => {},
});

const Tab = createBottomTabNavigator();

// معرّف فريد للجهاز (مؤقت لكل جلسة تشغيل)
const DEVICE_ID = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ── ألوان ───────────────────────────────────────────────
const C = {
  bg      : '#080d1a',
  tabBg   : '#04060f',
  tabLine : '#111827',
  active  : '#f59e0b',
  inactive: '#2d3a50',
};

// ── أيقونات التبويبات ────────────────────────────────────
function TabIcon({ name, focused }) {
  const map = {
    الرئيسية: focused ? '🏠' : '🏚️',
    بلاغ    : focused ? '🆘' : '⭕',
    محتوى   : focused ? '📋' : '📄',
    تواصل   : focused ? '💬' : '🗨️',
  };
  return <Text style={{ fontSize: 21 }}>{map[name] || '?'}</Text>;
}

// ── شاشة التحميل ─────────────────────────────────────────
function Splash() {
  return (
    <View style={sp.wrap}>
      <Text style={sp.icon}>🆘</Text>
      <Text style={sp.title}>طوارئ القرية</Text>
      <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 36 }} />
      <Text style={sp.sub}>البحث عن شبكة الطوارئ…</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  wrap : { flex: 1, backgroundColor: '#080d1a', alignItems: 'center', justifyContent: 'center' },
  icon : { fontSize: 60 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#e2e8f0', marginTop: 14 },
  sub  : { fontSize: 13, color: '#4b5563', marginTop: 14 },
});

// ── التطبيق الرئيسي ──────────────────────────────────────
export default function App() {
  const [node,      setNode]      = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading,   setLoading]   = useState(true);

  const refresh = async () => {
    const s = await getStatus();
    if (s && s.node) { setNode(s); setConnected(true); }
    else             { setNode(null); setConnected(false); }
  };

  useEffect(() => {
    (async () => { await refresh(); setLoading(false); })();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <Splash />;

  return (
    <AppCtx.Provider value={{ node, connected, deviceId: DEVICE_ID, refresh }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={C.bg} />
        <NavigationContainer
          theme={{
            dark  : true,
            colors: {
              primary     : C.active,
              background  : C.bg,
              card        : C.tabBg,
              text        : '#e2e8f0',
              border      : C.tabLine,
              notification: '#dc2626',
            },
          }}
        >
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown   : false,
              tabBarStyle   : {
                backgroundColor: C.tabBg,
                borderTopColor : C.tabLine,
                borderTopWidth : 1,
                height         : Platform.OS === 'ios' ? 76 : 60,
                paddingBottom  : Platform.OS === 'ios' ? 18 : 8,
                paddingTop     : 4,
              },
              tabBarActiveTintColor  : C.active,
              tabBarInactiveTintColor: C.inactive,
              tabBarLabelStyle       : { fontSize: 11, fontWeight: 'bold' },
              tabBarIcon: ({ focused }) =>
                <TabIcon name={route.name} focused={focused} />,
            })}
          >
            <Tab.Screen name="الرئيسية" component={HomeScreen}    />
            <Tab.Screen name="بلاغ"     component={ReportScreen}  />
            <Tab.Screen name="محتوى"    component={ContentScreen} />
            <Tab.Screen name="تواصل"    component={ChatScreen}    />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AppCtx.Provider>
  );
}
