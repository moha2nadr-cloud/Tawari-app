# 🆘 طوارئ القرية — تعليمات البناء والنشر الكاملة

## الخطوة 1 — تعديل كود ESP (مرة واحدة)

افتح كل ملف من الأربعة (`Emergency_1A` / `2A` / `1B` / `2B`) وطبّق تعديلين:

### التعديل أ: أضف الدوال قبل `setup()` مباشرةً
انسخ الكود من الملف `ESP_PATCH.cpp` من السطر الأول حتى نهاية `apiChatSend()`
والصقه في الملف قبل `void setup() {`

### التعديل ب: سجّل الـ endpoints داخل `setup()`
ابحث عن آخر سطر `server.on(...)` في `setup()` وأضف بعده:
```cpp
server.on("/api/status",    HTTP_GET,  apiStatus);
server.on("/api/content",   HTTP_GET,  apiContent);
server.on("/api/agents",    HTTP_GET,  apiAgents);
server.on("/api/report",    HTTP_POST, apiReport);
server.on("/api/chat/send", HTTP_POST, apiChatSend);
```
> ✅ هذا كل شيء! لا تعديلات أخرى في الـ ESP.

---

## الخطوة 2 — رفع ملفات التطبيق على Snack

### افتح من متصفح هاتفك:
👉 **https://snack.expo.dev**

### أنشئ حساب Expo (مجاناً)
- اضغط Sign Up
- استخدم Gmail أو أي إيميل

### ارفع الملفات بهذا الترتيب:

1. اضغط **`+`** لإضافة ملف
2. أضف الملفات:
```
App.js          ← استبدل المحتوى الافتراضي
api.js          ← ملف جديد في الجذر
screens/
  HomeScreen.js
  ReportScreen.js
  ContentScreen.js
  ChatScreen.js
```

### ثبّت الـ packages
في منطقة التبويب الجانبي في Snack، ابحث عن:
- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `@react-navigation/native-stack`
- `react-native-screens`
- `react-native-safe-area-context`
- `expo-location`

واضغط Add لكل واحد.

---

## الخطوة 3 — بناء APK عبر EAS (مجاناً)

### أنشئ حساب EAS (نفس حساب Expo):
👉 **https://expo.dev**

### من متصفح الهاتف، افتح:
👉 **https://expo.dev/accounts/[اسمك]/projects**

### البناء عبر الموقع مباشرة:
1. اضغط **New Project**
2. اختر **Import from Snack** أو انسخ Snack ID
3. اضغط **Build** → Android → APK

**أو استخدم Replit / GitHub Codespaces للبناء:**
1. افتح **https://replit.com** — أنشئ Node.js Repl
2. في الـ Shell:
```bash
npm install -g expo-cli eas-cli
eas login
eas build --platform android --profile preview
```

---

## الخطوة 4 — تثبيت APK على الهاتف

1. انتزل APK من رابط البناء
2. على الهاتف Android: **الإعدادات → الأمان → السماح بمصادر غير معروفة**
3. افتح ملف APK وثبّته

---

## طريقة الاستخدام

1. **افتح إعدادات Wi-Fi** على الهاتف
2. **اتصل بإحدى الشبكات:**
   - `Tawari-Qarya-A` أو `Tawari-Qarya-A2` (قرية A)
   - `Tawari-Qarya-B` أو `Tawari-Qarya-B2` (قرية B)
3. **افتح التطبيق** — يتصل تلقائياً
4. جميع الميزات تعمل فقط عند الاتصال بالشبكة ✅

---

## ملاحظات مهمة

| الوضع | ما يحدث |
|-------|---------|
| متصل بشبكة ESP | التطبيق يعمل بالكامل |
| غير متصل | شاشة "اتصل بالشبكة" — لا شيء يعمل |
| الشبكة محظورة | يظهر تحذير، لا يمكن إرسال بلاغات |
| البلاغ لم يصل للمركز | يُحفظ محلياً ويُرسَل عند عودة الاتصال |

## هيكل المنظومة بعد التعديل

```
Main Center (192.168.1.1)
│
├── Center A (192.168.4.1)
│     ├── Emergency 1-A  →  شبكة Tawari-Qarya-A
│     │      └── 🆕 API JSON للتطبيق
│     └── Emergency 2-A  →  شبكة Tawari-Qarya-A2
│            └── 🆕 API JSON للتطبيق
│
└── Center B (192.168.5.1)
      ├── Emergency 1-B  →  شبكة Tawari-Qarya-B
      │      └── 🆕 API JSON للتطبيق
      └── Emergency 2-B  →  شبكة Tawari-Qarya-B2
             └── 🆕 API JSON للتطبيق
```
