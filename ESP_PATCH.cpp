/*
 * ================================================================
 *  ESP PATCH — إضافات JSON API للتطبيق
 *  يُضاف هذا الكود لكل ملف من الملفات الأربعة:
 *    Emergency_1A_FIXED.ino
 *    Emergency_2A_FIXED.ino
 *    Emergency_1B_FIXED.ino
 *    Emergency_2B_FIXED.ino
 *
 *  الخطوات:
 *  1️⃣  أضف قسم "دوال API" قبل سطر setup()  مباشرةً
 *  2️⃣  في دالة setup()، بعد آخر سطر server.on(...) أضف الأسطر الخمسة
 * ================================================================
 */

// ================================================================
//  ① أضف هذا الكود كاملاً قبل setup() مباشرةً
// ================================================================

/* ── GET /api/status ─────────────────────────────────────────── */
void apiStatus() {
  server.send(200, "application/json; charset=UTF-8",
    "{\"node\":\""    + String(NODE_NAME)    + "\","
    "\"village\":\""  + String(VILLAGE_ID)   + "\","
    "\"parent\":\""   + String(PARENT_CENTER)+ "\","
    "\"connected\":"  + String(connectedToCenter ? "true" : "false") + ","
    "\"blocked\":"    + String(networkBlocked    ? "true" : "false") + ","
    "\"fw\":\""       + String(FIRMWARE_VER) + "\"}");
}

/* ── GET /api/content ────────────────────────────────────────── */
void apiContent() {
  String out = "[";
  for (int i = 0; i < ccCount; i++) {
    if (i > 0) out += ",";
    String t = cc[i].title; t.replace("\"", "'");
    String b = cc[i].body;  b.replace("\"", "'");
    out += "{\"kind\":\"" + cc[i].kind  + "\","
           "\"title\":\""+ t            + "\","
           "\"body\":\""  + b           + "\","
           "\"extra\":\""+ cc[i].extra  + "\"}";
  }
  out += "]";
  server.send(200, "application/json; charset=UTF-8", out);
}

/* ── GET /api/agents ─────────────────────────────────────────── */
void apiAgents() {
  String out = "[";
  for (int i = 0; i < agCount; i++) {
    if (i > 0) out += ",";
    out += "{\"name\":\""  + agents[i].name   + "\","
           "\"status\":\"" + agents[i].status + "\"}";
  }
  out += "]";
  server.send(200, "application/json; charset=UTF-8", out);
}

/* ── POST /api/report ────────────────────────────────────────── *
 *  body JSON: {"type":"SOS","loc":"...","note":"...","lat":"...","lon":"..."}
 * ─────────────────────────────────────────────────────────────── */
void apiReport() {
  String body = server.arg("plain");
  String type = jStr(body, "type");
  String loc  = jStr(body, "loc");
  String note = jStr(body, "note");
  String lat  = jStr(body, "lat");
  String lon  = jStr(body, "lon");

  if (type.length() == 0) {
    server.send(400, "application/json", "{\"ok\":false,\"e\":\"missing type\"}");
    return;
  }
  if (loc.length() == 0 && lat.length() > 0)
    loc = lat + "," + lon;

  uint16_t newId = repIDCounter;

  if (repCount < MAX_REPORTS) {
    reps[repCount].id       = repIDCounter++;
    reps[repCount].type     = type;
    reps[repCount].location = loc.length() > 0 ? loc : "غير محدد";
    reps[repCount].note     = note;
    reps[repCount].ts       = (uint32_t)millis();
    reps[repCount].status   = 0;
    reps[repCount].synced   = false;

    if (connectedToCenter)
      reps[repCount].synced = doForwardEmergency(newId, type,
                                                  reps[repCount].location, note);
    repCount++;
  }

  pushNotif("بلاغ تطبيق: " + type);

  bool synced = (repCount > 0) && reps[repCount - 1].synced;
  server.send(200, "application/json",
    "{\"ok\":true,"
    "\"id\":"      + String(newId)                    + ","
    "\"synced\":"  + String(synced ? "true" : "false") + "}");
}

/* ── POST /api/chat/send ─────────────────────────────────────── *
 *  body JSON: {"session":"...","from":"...","text":"..."}
 * ─────────────────────────────────────────────────────────────── */
void apiChatSend() {
  String body    = server.arg("plain");
  String session = jStr(body, "session");
  String from    = jStr(body, "from");
  String text    = jStr(body, "text");

  if (session.length() == 0 || text.length() == 0) {
    server.send(400, "application/json", "{\"ok\":false}");
    return;
  }

  String b = "{\"session\":\"" + session +
             "\",\"from\":\""  + from    +
             "\",\"text\":\""  + text    +
             "\",\"node\":\""  + String(NODE_NAME) + "\"}";

  bool ok = cPost("/api/chat/send", b);
  server.send(200, "application/json", ok ? "{\"ok\":true}" : "{\"ok\":false}");
}


// ================================================================
//  ② في دالة setup()، أضف هذه الأسطر الخمسة بعد آخر server.on(...)
//     وقبل سطر server.begin()
// ================================================================

/*
  server.on("/api/status",   HTTP_GET,  apiStatus);
  server.on("/api/content",  HTTP_GET,  apiContent);
  server.on("/api/agents",   HTTP_GET,  apiAgents);
  server.on("/api/report",   HTTP_POST, apiReport);
  server.on("/api/chat/send",HTTP_POST, apiChatSend);
*/
