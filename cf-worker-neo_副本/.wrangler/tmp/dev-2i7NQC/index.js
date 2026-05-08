var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-QxhcPi/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-QxhcPi/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/utils.ts
function uuid(separator = true) {
  const id = crypto.randomUUID();
  return separator ? id : id.replace(/-/g, "");
}
__name(uuid, "uuid");
async function md5(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(md5, "md5");
function unixTimestamp() {
  return Math.floor(Date.now() / 1e3);
}
__name(unixTimestamp, "unixTimestamp");
function isBASE64Data(value) {
  return typeof value === "string" && /^data:/.test(value);
}
__name(isBASE64Data, "isBASE64Data");
function extractBASE64DataFormat(value) {
  const match = value.trim().match(/^data:(.+);base64,/);
  return match ? match[1] : null;
}
__name(extractBASE64DataFormat, "extractBASE64DataFormat");
function removeBASE64DataHeader(value) {
  return value.replace(/^data:(.+);base64,/, "");
}
__name(removeBASE64DataHeader, "removeBASE64DataHeader");
var MIME_MAP = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  pdf: "application/pdf",
  txt: "text/plain",
  json: "application/json",
  html: "text/html"
};
function getMimeType(filename) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return MIME_MAP[ext] || "application/octet-stream";
}
__name(getMimeType, "getMimeType");
function getExtension(mimeType) {
  for (const [ext, mime] of Object.entries(MIME_MAP)) {
    if (mime === mimeType)
      return ext;
  }
  return null;
}
__name(getExtension, "getExtension");
function basename(url) {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").pop() || "unknown";
  } catch {
    return "unknown";
  }
}
__name(basename, "basename");
function randomChoice(arr) {
  if (!arr || arr.length === 0)
    return void 0;
  return arr[Math.floor(Math.random() * arr.length)];
}
__name(randomChoice, "randomChoice");
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
__name(sleep, "sleep");
function isString(value) {
  return typeof value === "string";
}
__name(isString, "isString");
function isArray(value) {
  return Array.isArray(value);
}
__name(isArray, "isArray");
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
__name(isObject, "isObject");
function isNumber(value) {
  return typeof value === "number" && !isNaN(value);
}
__name(isNumber, "isNumber");
function isFiniteNumber(value) {
  return isNumber(value) && isFinite(value);
}
__name(isFiniteNumber, "isFiniteNumber");
function defaultTo(value, defaultValue) {
  return value == null ? defaultValue : value;
}
__name(defaultTo, "defaultTo");
function attempt(fn) {
  try {
    return fn();
  } catch (err) {
    return err instanceof Error ? err : new Error(String(err));
  }
}
__name(attempt, "attempt");
function isError(value) {
  return value instanceof Error;
}
__name(isError, "isError");

// src/sse.ts
function createParser(onEvent) {
  let buffer = "";
  let eventType = "";
  let eventData = "";
  function dispatch() {
    if (eventData !== "" || eventType !== "") {
      onEvent({
        type: eventType || "message",
        data: eventData
      });
      eventType = "";
      eventData = "";
    }
  }
  __name(dispatch, "dispatch");
  return {
    feed(chunk) {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.endsWith("\r") ? line.slice(0, -1) : line;
        if (trimmed === "") {
          dispatch();
        } else if (trimmed.startsWith("data: ")) {
          eventData += (eventData ? "\n" : "") + trimmed.slice(6);
        } else if (trimmed.startsWith("event: ")) {
          eventType = trimmed.slice(7);
        } else if (trimmed.startsWith("id: ")) {
        } else if (trimmed.startsWith("retry: ")) {
        } else if (trimmed.startsWith(":")) {
        }
      }
    }
  };
}
__name(createParser, "createParser");

// src/chat.ts
var MODEL_NAME = "glm";
var DEFAULT_ASSISTANT_ID = "65940acff94777010aa6b796";
var ACCESS_TOKEN_EXPIRES = 3600;
var MAX_RETRY_COUNT = 3;
var RETRY_DELAY = 5e3;
var FILE_MAX_SIZE = 100 * 1024 * 1024;
var signSecret = "8a1317a7468aa3ad86e997d08f3f31cb";
function setSignSecret(secret) {
  signSecret = secret;
}
__name(setSignSecret, "setSignSecret");
var USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0"
];
var FAKE_HEADERS = {
  "Accept": "text/event-stream",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
  "App-Name": "chatglm",
  "Cache-Control": "no-cache",
  "Content-Type": "application/json",
  "Origin": "https://chatglm.cn",
  "Pragma": "no-cache",
  "Priority": "u=1, i",
  "Sec-Ch-Ua": '"Microsoft Edge";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "X-App-Fr": "browser_extension",
  "X-App-Platform": "pc",
  "X-App-Version": "0.0.1",
  "X-Device-Brand": "",
  "X-Device-Model": "",
  "X-Exp-Groups": "na_android_config:exp:NA,na_4o_config:exp:4o_A,tts_config:exp:tts_config_a,na_glm4plus_config:exp:open,mainchat_server_app:exp:A,mobile_history_daycheck:exp:a,desktop_toolbar:exp:A,chat_drawing_server:exp:A,drawing_server_cogview:exp:cogview4,app_welcome_v2:exp:A,chat_drawing_streamv2:exp:A,mainchat_rm_fc:exp:add,mainchat_dr:exp:open,chat_auto_entrance:exp:A,drawing_server_hi_dream:control:A,homepage_square:exp:close,assistant_recommend_prompt:exp:3,app_home_regular_user:exp:A,memory_common:exp:enable,mainchat_moe:exp:300,assistant_greet_user:exp:greet_user,app_welcome_personalize:exp:A,assistant_model_exp_group:exp:glm4.5,ai_wallet:exp:ai_wallet_enable",
  "X-Lang": "zh"
};
function getHeaders() {
  const userAgent = randomChoice(USER_AGENTS) || USER_AGENTS[0];
  return { ...FAKE_HEADERS, "User-Agent": userAgent };
}
__name(getHeaders, "getHeaders");
function injectToolsPrompt(messages, tools) {
  if (!tools || tools.length === 0)
    return messages;
  const toolsDesc = tools.map((tool) => {
    const fn = tool.function || tool;
    return `### ${fn.name}
Description: ${fn.description || ""}
Parameters: ${JSON.stringify(fn.parameters || {}, null, 2)}`;
  }).join("\n\n");
  const prompt = `You are an assistant with access to tools. When you need to use a tool, you MUST output ONLY a single JSON object with NO markdown, NO explanations, and NO extra text.

STRICT RULES:
1. If a tool is needed, output EXACTLY this format (nothing else):
{"tool_calls":[{"name":"TOOL_NAME","arguments":{"param":"value"}}]}

2. Do NOT wrap the JSON in markdown code blocks (no \`\`\`json).
3. Do NOT add any explanation before or after the JSON.
4. If no tool is needed, respond normally with plain text.

Available tools:
${toolsDesc}

Examples:
User: What is the weather in Beijing?
Assistant: {"tool_calls":[{"name":"get_weather","arguments":{"location":"Beijing"}}]}

User: Hello
Assistant: Hello! How can I help you today?`;
  const newMessages = [...messages];
  const systemIdx = newMessages.findIndex((m) => m.role === "system");
  if (systemIdx >= 0) {
    const original = newMessages[systemIdx].content || "";
    newMessages[systemIdx] = { ...newMessages[systemIdx], content: original + "\n\n" + prompt };
  } else {
    newMessages.unshift({ role: "system", content: prompt });
  }
  return newMessages;
}
__name(injectToolsPrompt, "injectToolsPrompt");
function parseToolCalls(content) {
  if (!content || !content.trim())
    return { tool_calls: null, text: content };
  let working = content.trim();
  const codeBlockMatch = working.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    working = codeBlockMatch[1].trim();
  }
  const braceMatch = extractJsonObject(working, "tool_calls");
  if (braceMatch) {
    try {
      const parsed = JSON.parse(braceMatch);
      if (parsed.tool_calls && Array.isArray(parsed.tool_calls) && parsed.tool_calls.length > 0) {
        const toolCalls = parsed.tool_calls.map((tc, idx) => ({
          id: `call_${Math.random().toString(36).slice(2, 11)}_${idx}`,
          type: "function",
          function: {
            name: tc.name || tc.function?.name || "",
            arguments: typeof tc.arguments === "string" ? tc.arguments : typeof tc.function?.arguments === "string" ? tc.function.arguments : JSON.stringify(tc.arguments || tc.function?.arguments || {})
          }
        }));
        let text = content.replace(braceMatch, "").trim();
        if (codeBlockMatch)
          text = content.replace(codeBlockMatch[0], "").trim();
        return { tool_calls: toolCalls, text };
      }
    } catch (_) {
    }
  }
  try {
    const fixed = working.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":').replace(/:\s*'([^']*)'/g, ':"$1"');
    const parsed = JSON.parse(fixed);
    if (parsed.tool_calls && Array.isArray(parsed.tool_calls) && parsed.tool_calls.length > 0) {
      const toolCalls = parsed.tool_calls.map((tc, idx) => ({
        id: `call_${Math.random().toString(36).slice(2, 11)}_${idx}`,
        type: "function",
        function: {
          name: tc.name || tc.function?.name || "",
          arguments: typeof tc.arguments === "string" ? tc.arguments : JSON.stringify(tc.arguments || {})
        }
      }));
      let text = content.replace(working, "").trim();
      if (codeBlockMatch)
        text = content.replace(codeBlockMatch[0], "").trim();
      return { tool_calls: toolCalls, text };
    }
  } catch (_) {
  }
  return { tool_calls: null, text: content };
}
__name(parseToolCalls, "parseToolCalls");
function extractJsonObject(str, key) {
  const idx = str.indexOf(`"${key}"`);
  if (idx === -1)
    return null;
  let start = idx;
  while (start > 0 && str[start] !== "{")
    start--;
  if (str[start] !== "{")
    return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"' && !escape) {
      inString = !inString;
      continue;
    }
    if (inString)
      continue;
    if (ch === "{")
      depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0)
        return str.slice(start, i + 1);
    }
  }
  return null;
}
__name(extractJsonObject, "extractJsonObject");
function convertToolMessages(messages) {
  return messages.map((m) => {
    if (m.role === "tool") {
      return {
        role: "user",
        content: `\u5DE5\u5177 ${m.name || ""} (\u8C03\u7528ID: ${m.tool_call_id || ""}) \u8FD4\u56DE\u7ED3\u679C\uFF1A
${m.content || ""}`
      };
    }
    return m;
  });
}
__name(convertToolMessages, "convertToolMessages");
function getWorkerCache() {
  return caches.default;
}
__name(getWorkerCache, "getWorkerCache");
function getTokenCacheKey(refreshToken) {
  return new Request(`https://internal-cache/glm-token/${refreshToken}`);
}
__name(getTokenCacheKey, "getTokenCacheKey");
async function getCachedAccessToken(refreshToken) {
  const response = await getWorkerCache().match(getTokenCacheKey(refreshToken));
  if (!response)
    return null;
  try {
    const data = await response.json();
    if (data.refreshTime > unixTimestamp())
      return data.accessToken;
  } catch {
  }
  return null;
}
__name(getCachedAccessToken, "getCachedAccessToken");
async function setCachedAccessToken(refreshToken, accessToken, refreshTime) {
  await getWorkerCache().put(getTokenCacheKey(refreshToken), new Response(JSON.stringify({ accessToken, refreshTime }), {
    headers: { "Content-Type": "application/json" }
  }));
}
__name(setCachedAccessToken, "setCachedAccessToken");
async function deleteCachedAccessToken(refreshToken) {
  await getWorkerCache().delete(getTokenCacheKey(refreshToken));
}
__name(deleteCachedAccessToken, "deleteCachedAccessToken");
async function generateSign() {
  const e = Date.now();
  const A = e.toString();
  const t = A.length;
  const o = A.split("").map((c) => Number(c));
  const i = o.reduce((sum, v) => sum + v, 0) - o[t - 2];
  const a = i % 10;
  const timestamp2 = A.substring(0, t - 2) + a + A.substring(t - 1, t);
  const nonce = uuid(false);
  const sign = await md5(`${timestamp2}-${nonce}-${signSecret}`);
  return { timestamp: timestamp2, nonce, sign };
}
__name(generateSign, "generateSign");
var tokenRequestQueues = {};
async function requestToken(refreshToken) {
  if (tokenRequestQueues[refreshToken]) {
    return new Promise((resolve) => tokenRequestQueues[refreshToken].push(resolve));
  }
  tokenRequestQueues[refreshToken] = [];
  const doRequest = /* @__PURE__ */ __name(async () => {
    const sign = await generateSign();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15e3);
    try {
      const response = await fetch("https://chatglm.cn/chatglm/user-api/user/refresh", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          "Content-Type": "application/json",
          ...getHeaders(),
          "X-Device-Id": uuid(false),
          "X-Nonce": sign.nonce,
          "X-Request-Id": uuid(false),
          "X-Sign": sign.sign,
          "X-Timestamp": `${sign.timestamp}`
        },
        signal: controller.signal
      });
      const data = await checkResult(response, refreshToken);
      const { access_token, refresh_token } = data.result;
      return { accessToken: access_token, refreshToken: refresh_token, refreshTime: unixTimestamp() + ACCESS_TOKEN_EXPIRES };
    } finally {
      clearTimeout(timeoutId);
    }
  }, "doRequest");
  try {
    const result = await doRequest();
    tokenRequestQueues[refreshToken].forEach((resolve) => resolve(result));
    return result;
  } catch (err) {
    tokenRequestQueues[refreshToken].forEach((resolve) => resolve(err));
    throw err;
  } finally {
    delete tokenRequestQueues[refreshToken];
  }
}
__name(requestToken, "requestToken");
async function acquireToken(refreshToken) {
  const cached = await getCachedAccessToken(refreshToken);
  if (cached)
    return cached;
  const tokenData = await requestToken(refreshToken);
  await setCachedAccessToken(refreshToken, tokenData.accessToken, tokenData.refreshTime);
  return tokenData.accessToken;
}
__name(acquireToken, "acquireToken");
async function removeConversation(convId, refreshToken, assistantId = DEFAULT_ASSISTANT_ID) {
  const token = await acquireToken(refreshToken);
  const sign = await generateSign();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15e3);
  try {
    const response = await fetch("https://chatglm.cn/chatglm/backend-api/assistant/conversation/delete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Referer: "https://chatglm.cn/main/alltoolsdetail",
        "X-Device-Id": uuid(false),
        "X-Request-Id": uuid(false),
        "X-Sign": sign.sign,
        "X-Timestamp": sign.timestamp,
        "X-Nonce": sign.nonce,
        ...getHeaders()
      },
      body: JSON.stringify({ assistant_id: assistantId, conversation_id: convId }),
      signal: controller.signal
    });
    await checkResult(response, refreshToken);
  } catch {
  } finally {
    clearTimeout(timeoutId);
  }
}
__name(removeConversation, "removeConversation");
async function checkResult(response, refreshToken) {
  const data = await response.json().catch(() => null);
  if (!data)
    return null;
  const { code, status, message } = data;
  if (!isFiniteNumber(code) && !isFiniteNumber(status))
    return data;
  if (code === 0 || status === 0)
    return data;
  if (code == 401)
    await deleteCachedAccessToken(refreshToken);
  if (message?.includes("40102")) {
    throw new Error(`[\u8BF7\u6C42glm\u5931\u8D25]: \u60A8\u7684refresh_token\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55\u83B7\u53D6`);
  }
  throw new Error(`[\u8BF7\u6C42glm\u5931\u8D25]: ${message}`);
}
__name(checkResult, "checkResult");
async function glmPostStream(url, body, headers, timeout = 12e4) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
__name(glmPostStream, "glmPostStream");
async function createCompletion(messages, refreshToken, model = MODEL_NAME, refConvId = "", retryCount = 0, tools) {
  return (async () => {
    let processedMessages = convertToolMessages(messages);
    processedMessages = injectToolsPrompt(processedMessages, tools || []);
    const refFileUrls = extractRefFileUrls(processedMessages);
    const refs = refFileUrls.length ? await Promise.all(refFileUrls.map((fileUrl) => uploadFile(fileUrl, refreshToken))) : [];
    if (!/[0-9a-zA-Z]{24}/.test(refConvId))
      refConvId = "";
    let assistantId = /^[a-z0-9]{24,}$/.test(model) ? model : DEFAULT_ASSISTANT_ID;
    let chatMode = "";
    if (model.includes("think") || model.includes("zero")) {
      chatMode = "zero";
    }
    if (model.includes("deepresearch")) {
      chatMode = "deep_research";
    }
    const token = await acquireToken(refreshToken);
    const sign = await generateSign();
    const response = await glmPostStream(
      "https://chatglm.cn/chatglm/backend-api/assistant/stream",
      {
        assistant_id: assistantId,
        conversation_id: refConvId,
        project_id: "",
        chat_type: "user_chat",
        messages: messagesPrepare(processedMessages, refs, !!refConvId),
        meta_data: {
          channel: "",
          chat_mode: chatMode || void 0,
          draft_id: "",
          if_plus_model: true,
          input_question_type: "xxxx",
          is_networking: true,
          is_test: false,
          platform: "pc",
          quote_log_id: "",
          cogview: { rm_label_watermark: false }
        }
      },
      {
        Authorization: `Bearer ${token}`,
        ...getHeaders(),
        "X-Device-Id": uuid(false),
        "X-Request-Id": uuid(false),
        "X-Sign": sign.sign,
        "X-Timestamp": sign.timestamp,
        "X-Nonce": sign.nonce
      }
    );
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream")) {
      const errText = await response.text();
      console.error(errText);
      throw new Error(`Stream response Content-Type invalid: ${contentType}`);
    }
    const answer = await receiveStream(model, response.body, tools);
    removeConversation(answer.id, refreshToken, assistantId).catch(() => {
    });
    return answer;
  })().catch(async (err) => {
    if (retryCount < MAX_RETRY_COUNT) {
      console.error(`Stream response error: ${err.stack || err.message}`);
      await sleep(RETRY_DELAY);
      return createCompletion(messages, refreshToken, model, refConvId, retryCount + 1, tools);
    }
    throw err;
  });
}
__name(createCompletion, "createCompletion");
async function createCompletionStream(messages, refreshToken, model = MODEL_NAME, refConvId = "", retryCount = 0, tools) {
  return (async () => {
    let processedMessages = convertToolMessages(messages);
    processedMessages = injectToolsPrompt(processedMessages, tools || []);
    const refFileUrls = extractRefFileUrls(processedMessages);
    const refs = refFileUrls.length ? await Promise.all(refFileUrls.map((fileUrl) => uploadFile(fileUrl, refreshToken))) : [];
    if (!/[0-9a-zA-Z]{24}/.test(refConvId))
      refConvId = "";
    let assistantId = /^[a-z0-9]{24,}$/.test(model) ? model : DEFAULT_ASSISTANT_ID;
    let chatMode = "";
    if (model.includes("think") || model.includes("zero")) {
      chatMode = "zero";
    }
    if (model.includes("deepresearch")) {
      chatMode = "deep_research";
    }
    const token = await acquireToken(refreshToken);
    const sign = await generateSign();
    const response = await glmPostStream(
      "https://chatglm.cn/chatglm/backend-api/assistant/stream",
      {
        assistant_id: assistantId,
        conversation_id: refConvId,
        project_id: "",
        chat_type: "user_chat",
        messages: messagesPrepare(processedMessages, refs, !!refConvId),
        meta_data: {
          channel: "",
          chat_mode: chatMode || void 0,
          draft_id: "",
          if_plus_model: true,
          input_question_type: "xxxx",
          is_networking: true,
          is_test: false,
          platform: "pc",
          quote_log_id: "",
          cogview: { rm_label_watermark: false }
        }
      },
      {
        Authorization: `Bearer ${token}`,
        Referer: assistantId == DEFAULT_ASSISTANT_ID ? "https://chatglm.cn/main/alltoolsdetail" : `https://chatglm.cn/main/gdetail/${assistantId}`,
        "X-Device-Id": uuid(false),
        "X-Request-Id": uuid(false),
        "X-Sign": sign.sign,
        "X-Timestamp": sign.timestamp,
        "X-Nonce": sign.nonce,
        ...getHeaders()
      }
    );
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream")) {
      const errText = await response.text();
      console.error("Invalid response Content-Type:", contentType, errText);
      const encoder = new TextEncoder();
      return new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            id: "",
            model: MODEL_NAME,
            object: "chat.completion.chunk",
            choices: [{ index: 0, delta: { role: "assistant", content: "\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\uFF0C\u7B2C\u4E09\u65B9\u54CD\u5E94\u9519\u8BEF" }, finish_reason: "stop" }],
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
            created: unixTimestamp()
          })}

`));
          controller.close();
        }
      });
    }
    return createTransStream(model, response.body, (convId) => {
      removeConversation(convId, refreshToken, assistantId).catch(() => {
      });
    }, tools);
  })().catch(async (err) => {
    if (retryCount < MAX_RETRY_COUNT) {
      console.error(`Stream response error: ${err.stack || err.message}`);
      await sleep(RETRY_DELAY);
      return createCompletionStream(messages, refreshToken, model, refConvId, retryCount + 1, tools);
    }
    throw err;
  });
}
__name(createCompletionStream, "createCompletionStream");
async function generateImages(model = "65a232c082ff90a2ad2f15e2", prompt, refreshToken, retryCount = 0) {
  return (async () => {
    const messages = [{ role: "user", content: prompt.indexOf("\u753B") == -1 ? `\u8BF7\u753B\uFF1A${prompt}` : prompt }];
    const token = await acquireToken(refreshToken);
    const sign = await generateSign();
    const response = await glmPostStream(
      "https://chatglm.cn/chatglm/backend-api/assistant/stream",
      {
        assistant_id: model,
        conversation_id: "",
        messages: messagesPrepare(messages, []),
        meta_data: {
          channel: "",
          draft_id: "",
          if_plus_model: true,
          input_question_type: "xxxx",
          is_test: false,
          platform: "pc",
          quote_log_id: ""
        }
      },
      {
        Authorization: `Bearer ${token}`,
        Referer: `https://chatglm.cn/main/gdetail/${model}`,
        "X-Device-Id": uuid(false),
        "X-Request-Id": uuid(false),
        "X-Sign": sign.sign,
        "X-Timestamp": sign.timestamp,
        "X-Nonce": sign.nonce,
        ...getHeaders()
      }
    );
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream"))
      throw new Error(`Stream response Content-Type invalid: ${contentType}`);
    const { convId, imageUrls } = await receiveImages(response.body);
    removeConversation(convId, refreshToken, model).catch(() => {
    });
    if (imageUrls.length == 0)
      throw new Error("\u56FE\u50CF\u751F\u6210\u5931\u8D25");
    return imageUrls;
  })().catch(async (err) => {
    if (retryCount < MAX_RETRY_COUNT) {
      console.error(`Image generation error: ${err.message}`);
      await sleep(RETRY_DELAY);
      return generateImages(model, prompt, refreshToken, retryCount + 1);
    }
    throw err;
  });
}
__name(generateImages, "generateImages");
async function generateVideos(model = "cogvideox", prompt, refreshToken, options, refConvId = "", retryCount = 0) {
  return (async () => {
    if (!/[0-9a-zA-Z]{24}/.test(refConvId))
      refConvId = "";
    const sourceList = [];
    if (model == "cogvideox-pro") {
      const imageUrls = await generateImages(void 0, prompt, refreshToken);
      options.imageUrl = imageUrls[0];
    }
    if (options.imageUrl) {
      const uploadResult = await uploadFile(options.imageUrl, refreshToken, true);
      sourceList.push(uploadResult.source_id);
    }
    let token = await acquireToken(refreshToken);
    const sign = await generateSign();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3e4);
    let result;
    try {
      const resp = await fetch("https://chatglm.cn/chatglm/video-api/v1/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Referer: "https://chatglm.cn/video",
          "X-Device-Id": uuid(false),
          "X-Request-Id": uuid(false),
          "X-Sign": sign.sign,
          "X-Timestamp": sign.timestamp,
          "X-Nonce": sign.nonce,
          ...getHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversation_id: refConvId,
          prompt,
          source_list: sourceList.length > 0 ? sourceList : void 0,
          advanced_parameter_extra: {
            emotional_atmosphere: options.emotionalAtmosphere,
            mirror_mode: options.mirrorMode,
            video_style: options.videoStyle
          }
        }),
        signal: controller.signal
      });
      result = await checkResult(resp, refreshToken);
    } finally {
      clearTimeout(timeoutId);
    }
    const { chat_id: chatId, conversation_id: convId } = result.result;
    const startTime = unixTimestamp();
    const results = [];
    while (true) {
      if (unixTimestamp() - startTime > 600)
        throw new Error("\u89C6\u9891\u751F\u6210\u5931\u8D25\uFF1A\u8D85\u65F6");
      token = await acquireToken(refreshToken);
      const s = await generateSign();
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 3e4);
      let statusResult;
      try {
        const resp = await fetch(`https://chatglm.cn/chatglm/video-api/v1/chat/status/${chatId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Referer: "https://chatglm.cn/video",
            "X-Device-Id": uuid(false),
            "X-Request-Id": uuid(false),
            "X-Sign": s.sign,
            "X-Timestamp": s.timestamp,
            "X-Nonce": s.nonce,
            ...getHeaders()
          },
          signal: ctrl.signal
        });
        statusResult = await checkResult(resp, refreshToken);
      } finally {
        clearTimeout(tid);
      }
      const { status, video_url, cover_url, video_duration, resolution } = statusResult.result;
      if (status != "init" && status != "processing") {
        if (status != "finished")
          throw new Error("\u89C6\u9891\u751F\u6210\u5931\u8D25");
        let videoUrl = video_url;
        if (options.audioId) {
          const [key, id] = options.audioId.split("-");
          token = await acquireToken(refreshToken);
          const s2 = await generateSign();
          const ctrl2 = new AbortController();
          const tid2 = setTimeout(() => ctrl2.abort(), 3e4);
          try {
            const resp = await fetch("https://chatglm.cn/chatglm/video-api/v1/static/composite_video", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                Referer: "https://chatglm.cn/video",
                "X-Device-Id": uuid(false),
                "X-Request-Id": uuid(false),
                "X-Sign": s2.sign,
                "X-Timestamp": s2.timestamp,
                "X-Nonce": s2.nonce,
                ...getHeaders(),
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ chat_id: chatId, key, audio_id: id }),
              signal: ctrl2.signal
            });
            const compositeResult = await checkResult(resp, refreshToken);
            videoUrl = compositeResult.result.url;
          } finally {
            clearTimeout(tid2);
          }
        }
        results.push({ conversation_id: convId, cover_url, video_url: videoUrl, video_duration, resolution });
        break;
      }
      await sleep(1e3);
    }
    fetch(`https://chatglm.cn/chatglm/video-api/v1/chat/${chatId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, Referer: "https://chatglm.cn/video", "X-Device-Id": uuid(false), "X-Request-Id": uuid(false), ...getHeaders() }
    }).catch(() => {
    });
    return results;
  })().catch(async (err) => {
    if (retryCount < MAX_RETRY_COUNT) {
      console.error(`Video generation error: ${err.message}`);
      await sleep(RETRY_DELAY);
      return generateVideos(model, prompt, refreshToken, options, refConvId, retryCount + 1);
    }
    throw err;
  });
}
__name(generateVideos, "generateVideos");
function extractRefFileUrls(messages) {
  const urls2 = [];
  if (!messages.length)
    return urls2;
  const lastMessage = messages[messages.length - 1];
  if (isArray(lastMessage.content)) {
    lastMessage.content.forEach((v) => {
      if (!isObject(v) || !["file", "image_url"].includes(v["type"]))
        return;
      if (v["type"] == "file" && isObject(v["file_url"]) && isString(v["file_url"]["url"]))
        urls2.push(v["file_url"]["url"]);
      else if (v["type"] == "image_url" && isObject(v["image_url"]) && isString(v["image_url"]["url"]))
        urls2.push(v["image_url"]["url"]);
    });
  }
  return urls2;
}
__name(extractRefFileUrls, "extractRefFileUrls");
function messagesPrepare(messages, refs, isRefConv = false) {
  let content;
  if (isRefConv || messages.length < 2) {
    content = messages.reduce((content2, message) => {
      if (isArray(message.content)) {
        return message.content.reduce((_content, v) => {
          if (!isObject(v) || v["type"] != "text")
            return _content;
          return _content + (v["text"] || "") + "\n";
        }, content2);
      }
      return content2 + `${message.content}
`;
    }, "");
  } else {
    const latestMessage = messages[messages.length - 1];
    const hasFileOrImage = isArray(latestMessage.content) && latestMessage.content.some((v) => typeof v === "object" && ["file", "image_url"].includes(v["type"]));
    if (hasFileOrImage) {
      messages.splice(messages.length - 1, 0, { content: "\u5173\u6CE8\u7528\u6237\u6700\u65B0\u53D1\u9001\u6587\u4EF6\u548C\u6D88\u606F", role: "system" });
    }
    content = (messages.reduce((content2, message) => {
      const role = message.role.replace("system", "<|sytstem|>").replace("assistant", "<|assistant|>").replace("user", "<|user|>");
      if (isArray(message.content)) {
        return message.content.reduce((_content, v) => {
          if (!isObject(v) || v["type"] != "text")
            return _content;
          return _content + (`${role}
` + v["text"] || "") + "\n";
        }, content2);
      }
      return content2 += `${role}
${message.content}
`;
    }, "") + "<|assistant|>\n").replace(/\!\[.+\]\(.+\)/g, "").replace(/\/mnt\/data\/.+/g, "");
  }
  const fileRefs = refs.filter((ref) => !ref.width && !ref.height);
  const imageRefs = refs.filter((ref) => ref.width || ref.height).map((ref) => {
    ref.image_url = ref.file_url;
    return ref;
  });
  return [{
    role: "user",
    content: [
      { type: "text", text: content },
      ...fileRefs.length == 0 ? [] : [{ type: "file", file: fileRefs }],
      ...imageRefs.length == 0 ? [] : [{ type: "image", image: imageRefs }]
    ]
  }];
}
__name(messagesPrepare, "messagesPrepare");
async function checkFileUrl(fileUrl) {
  if (isBASE64Data(fileUrl))
    return;
  const response = await fetch(fileUrl, { method: "HEAD" });
  if (response.status >= 400)
    throw new Error(`File ${fileUrl} is not valid: [${response.status}] ${response.statusText}`);
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const fileSize = parseInt(contentLength, 10);
    if (fileSize > FILE_MAX_SIZE)
      throw new Error(`File ${fileUrl} exceeds size limit`);
  }
}
__name(checkFileUrl, "checkFileUrl");
async function uploadFile(fileUrl, refreshToken, isVideoImage = false) {
  await checkFileUrl(fileUrl);
  let filename, fileData, mimeType = null;
  if (isBASE64Data(fileUrl)) {
    mimeType = extractBASE64DataFormat(fileUrl);
    const ext = mimeType ? getExtension(mimeType) : "bin";
    filename = `${uuid()}.${ext || "bin"}`;
    const base64Data = removeBASE64DataHeader(fileUrl);
    fileData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0)).buffer;
  } else {
    filename = basename(fileUrl);
    const response2 = await fetch(fileUrl);
    fileData = await response2.arrayBuffer();
  }
  mimeType = mimeType || getMimeType(filename);
  const formData = new FormData();
  formData.append("file", new Blob([fileData], { type: mimeType }), filename);
  const token = await acquireToken(refreshToken);
  const uploadUrl = isVideoImage ? "https://chatglm.cn/chatglm/video-api/v1/static/upload" : "https://chatglm.cn/chatglm/backend-api/assistant/file_upload";
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Referer: isVideoImage ? "https://chatglm.cn/video" : "https://chatglm.cn/",
      ...getHeaders()
    },
    body: formData
  });
  const uploadResult = await checkResult(response, refreshToken);
  return uploadResult.result;
}
__name(uploadFile, "uploadFile");
async function receiveStream(model, readableStream, tools) {
  return new Promise((resolve, reject) => {
    const data = {
      id: "",
      model,
      object: "chat.completion",
      choices: [{ index: 0, message: { role: "assistant", content: "", reasoning_content: null }, finish_reason: "stop" }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      created: unixTimestamp()
    };
    const isSilentModel = model.includes("silent");
    const cachedParts = [];
    const parser = createParser((event) => {
      try {
        const result = attempt(() => JSON.parse(event.data));
        if (isError(result))
          throw new Error(`Stream response invalid: ${event.data}`);
        if (!data.id && result.conversation_id)
          data.id = result.conversation_id;
        if (result.status != "finish") {
          if (result.parts) {
            cachedParts.length = 0;
            cachedParts.push(...result.parts);
          }
          const searchMap = /* @__PURE__ */ new Map();
          cachedParts.forEach((part) => {
            if (!part.content || !isArray(part.content))
              return;
            const { meta_data } = part;
            part.content.forEach((item) => {
              if (item.type == "tool_result" && meta_data?.tool_result_extra?.search_results) {
                meta_data.tool_result_extra.search_results.forEach((res) => {
                  if (res.match_key)
                    searchMap.set(res.match_key, res);
                });
              }
            });
          });
          const keyToIdMap = /* @__PURE__ */ new Map();
          let counter = 1;
          let fullText = "";
          let fullReasoning = "";
          cachedParts.forEach((part) => {
            const { content, meta_data } = part;
            if (!isArray(content))
              return;
            let partText = "";
            let partReasoning = "";
            content.forEach((value) => {
              const { type, text, think, image, code, content: innerContent } = value;
              if (type == "text") {
                let txt = text;
                if (searchMap.size > 0) {
                  txt = txt.replace(/【?(turn\d+[a-zA-Z]+\d+)】?/g, (match, key) => {
                    const searchInfo = searchMap.get(key);
                    if (!searchInfo)
                      return match;
                    if (!keyToIdMap.has(key))
                      keyToIdMap.set(key, counter++);
                    const newId = keyToIdMap.get(key);
                    return ` [${newId}](${searchInfo.url})`;
                  });
                }
                partText += txt;
              } else if (type == "think" && !isSilentModel) {
                partReasoning += think;
              } else if (type == "tool_result" && meta_data?.tool_result_extra?.search_results && isArray(meta_data.tool_result_extra.search_results) && !isSilentModel) {
                partReasoning += meta_data.tool_result_extra.search_results.reduce((meta, v) => meta + `> \u68C0\u7D22 ${v.title}(${v.url}) ...
`, "");
              } else if (type == "quote_result" && part.status == "finish" && meta_data && isArray(meta_data.metadata_list) && !isSilentModel) {
                partReasoning += meta_data.metadata_list.reduce((meta, v) => meta + `> \u68C0\u7D22 ${v.title}(${v.url}) ...
`, "");
              } else if (type == "image" && isArray(image) && part.status == "finish") {
                partText += image.reduce((imgs, v) => imgs + (/^(http|https):\/\//.test(v.image_url) ? `![\u56FE\u50CF](${v.image_url || ""})` : ""), "") + "\n";
              } else if (type == "code") {
                partText += "```python\n" + code + (part.status == "finish" ? "\n```\n" : "");
              } else if (type == "execution_output" && isString(innerContent) && part.status == "finish") {
                partText += innerContent + "\n";
              }
            });
            if (partText)
              fullText += (fullText.length > 0 ? "\n" : "") + partText;
            if (partReasoning)
              fullReasoning += (fullReasoning.length > 0 ? "\n" : "") + partReasoning;
          });
          data.choices[0].message.content = fullText;
          data.choices[0].message.reasoning_content = fullReasoning || null;
        } else {
          let content = data.choices[0].message.content;
          content = content.replace(/【\d+†(来源|源|source)】/g, "");
          data.choices[0].message.content = content;
          if (tools && tools.length > 0) {
            const parsed = parseToolCalls(content);
            if (parsed.tool_calls) {
              data.choices[0].message.tool_calls = parsed.tool_calls;
              data.choices[0].message.content = parsed.text || "";
              data.choices[0].finish_reason = "tool_calls";
            }
          }
          resolve(data);
        }
      } catch (err) {
        reject(err);
      }
    });
    const reader = readableStream.getReader();
    const decoder = new TextDecoder();
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            resolve(data);
            break;
          }
          parser.feed(decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        reject(err);
      } finally {
        reader.releaseLock();
      }
    })();
  });
}
__name(receiveStream, "receiveStream");
function createTransStream(model, readableStream, endCallback, tools) {
  const created = unixTimestamp();
  const encoder = new TextEncoder();
  const isSilentModel = model.includes("silent");
  let sentContent = "";
  let sentReasoning = "";
  let fullContent = "";
  let isToolCallMode = false;
  let mightBeToolCall = false;
  let pendingContent = "";
  const cachedParts = [];
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        id: "",
        model,
        object: "chat.completion.chunk",
        choices: [{ index: 0, delta: { role: "assistant", content: "" }, finish_reason: null }],
        created
      })}

`));
      const reader = readableStream.getReader();
      const decoder = new TextDecoder();
      const parser = createParser((event) => {
        try {
          const result = attempt(() => JSON.parse(event.data));
          if (isError(result))
            return;
          if (result.status != "finish" && result.status != "intervene") {
            if (result.parts) {
              result.parts.forEach((part) => {
                const index = cachedParts.findIndex((p) => p.logic_id === part.logic_id);
                if (index !== -1)
                  cachedParts[index] = part;
                else
                  cachedParts.push(part);
              });
            }
            const searchMap = /* @__PURE__ */ new Map();
            cachedParts.forEach((part) => {
              if (!part.content || !isArray(part.content))
                return;
              const { meta_data } = part;
              part.content.forEach((item) => {
                if (item.type == "tool_result" && meta_data?.tool_result_extra?.search_results) {
                  meta_data.tool_result_extra.search_results.forEach((res) => {
                    if (res.match_key)
                      searchMap.set(res.match_key, res);
                  });
                }
              });
            });
            const keyToIdMap = /* @__PURE__ */ new Map();
            let counter = 1;
            let fullText = "";
            let fullReasoning = "";
            cachedParts.forEach((part) => {
              const { content, meta_data } = part;
              if (!isArray(content))
                return;
              let partText = "";
              let partReasoning = "";
              content.forEach((value) => {
                const { type, text, think, image, code, content: innerContent } = value;
                if (type == "text") {
                  let txt = text;
                  if (searchMap.size > 0) {
                    txt = txt.replace(/【?(turn\d+[a-zA-Z]+\d+)】?/g, (match, key) => {
                      const searchInfo = searchMap.get(key);
                      if (!searchInfo)
                        return match;
                      if (!keyToIdMap.has(key))
                        keyToIdMap.set(key, counter++);
                      const newId = keyToIdMap.get(key);
                      return ` [${newId}](${searchInfo.url})`;
                    });
                  }
                  partText += txt;
                } else if (type == "think" && !isSilentModel) {
                  partReasoning += think;
                } else if (type == "tool_result" && meta_data?.tool_result_extra?.search_results && isArray(meta_data.tool_result_extra.search_results) && !isSilentModel) {
                  partReasoning += meta_data.tool_result_extra.search_results.reduce((meta, v) => meta + `> \u68C0\u7D22 ${v.title}(${v.url}) ...
`, "");
                } else if (type == "quote_result" && part.status == "finish" && meta_data && isArray(meta_data.metadata_list) && !isSilentModel) {
                  partReasoning += meta_data.metadata_list.reduce((meta, v) => meta + `> \u68C0\u7D22 ${v.title}(${v.url}) ...
`, "");
                } else if (type == "image" && isArray(image) && part.status == "finish") {
                  partText += image.reduce((imgs, v) => imgs + (/^(http|https):\/\//.test(v.image_url) ? `![\u56FE\u50CF](${v.image_url || ""})` : ""), "") + "\n";
                } else if (type == "code") {
                  partText += "```python\n" + code + (part.status == "finish" ? "\n```\n" : "");
                } else if (type == "execution_output" && isString(innerContent) && part.status == "finish") {
                  partText += innerContent + "\n";
                }
              });
              if (partText)
                fullText += (fullText.length > 0 ? "\n" : "") + partText;
              if (partReasoning)
                fullReasoning += (fullReasoning.length > 0 ? "\n" : "") + partReasoning;
            });
            const reasoningChunk = fullReasoning.substring(sentReasoning.length);
            if (reasoningChunk) {
              sentReasoning += reasoningChunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                id: result.conversation_id,
                model: MODEL_NAME,
                object: "chat.completion.chunk",
                choices: [{ index: 0, delta: { reasoning_content: reasoningChunk }, finish_reason: null }],
                created
              })}

`));
            }
            const chunk = fullText.substring(sentContent.length);
            if (chunk) {
              sentContent += chunk;
              fullContent += chunk;
              if (!isToolCallMode && tools && tools.length > 0) {
                const trimmed = fullContent.trim();
                if (!mightBeToolCall) {
                  if (trimmed.startsWith("{")) {
                    mightBeToolCall = true;
                    pendingContent += chunk;
                  } else {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      id: result.conversation_id,
                      model: MODEL_NAME,
                      object: "chat.completion.chunk",
                      choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }],
                      created
                    })}

`));
                  }
                } else {
                  pendingContent += chunk;
                  if (trimmed.length >= 20) {
                    if (trimmed.includes('"tool_calls"') || trimmed.includes("'tool_calls'") || trimmed.includes("tool_calls")) {
                      isToolCallMode = true;
                      pendingContent = "";
                    } else {
                      mightBeToolCall = false;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        id: result.conversation_id,
                        model: MODEL_NAME,
                        object: "chat.completion.chunk",
                        choices: [{ index: 0, delta: { content: pendingContent }, finish_reason: null }],
                        created
                      })}

`));
                      pendingContent = "";
                    }
                  }
                }
              } else if (!isToolCallMode) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  id: result.conversation_id,
                  model: MODEL_NAME,
                  object: "chat.completion.chunk",
                  choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }],
                  created
                })}

`));
              }
            }
          } else {
            let finishReason = "stop";
            let delta = result.status == "intervene" && result.last_error?.intervene_text ? { content: `

${result.last_error.intervene_text}` } : {};
            if (tools && tools.length > 0) {
              const parsed = parseToolCalls(fullContent);
              if (parsed.tool_calls) {
                finishReason = "tool_calls";
                delta = { tool_calls: parsed.tool_calls };
              }
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              id: result.conversation_id,
              model: MODEL_NAME,
              object: "chat.completion.chunk",
              choices: [{
                index: 0,
                delta,
                finish_reason: finishReason
              }],
              usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
              created
            })}

`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            endCallback?.(result.conversation_id);
          }
        } catch (err) {
          controller.error(err);
        }
      });
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }
          parser.feed(decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    }
  });
}
__name(createTransStream, "createTransStream");
async function receiveImages(readableStream) {
  return new Promise((resolve, reject) => {
    let convId = "";
    const imageUrls = [];
    const parser = createParser((event) => {
      try {
        const result = attempt(() => JSON.parse(event.data));
        if (isError(result))
          throw new Error(`Stream response invalid: ${event.data}`);
        if (!convId && result.conversation_id)
          convId = result.conversation_id;
        if (result.status == "intervene")
          throw new Error("\u5185\u5BB9\u7531\u4E8E\u5408\u89C4\u95EE\u9898\u5DF2\u88AB\u963B\u6B62\u751F\u6210");
        if (result.status != "finish") {
          result.parts.forEach((part) => {
            const { status: partStatus, content } = part;
            if (!isArray(content))
              return;
            content.forEach((value) => {
              const { type, image, text } = value;
              if (type == "image" && isArray(image) && partStatus == "finish") {
                image.forEach((value2) => {
                  if (!/^(http|https):\/\//.test(value2.image_url) || imageUrls.includes(value2.image_url))
                    return;
                  imageUrls.push(value2.image_url);
                });
              }
              if (type == "text" && partStatus == "finish") {
                const urlPattern = /\((https?:\/\/\S+)\)/g;
                let match;
                while ((match = urlPattern.exec(text)) !== null) {
                  const url = match[1];
                  if (!imageUrls.includes(url))
                    imageUrls.push(url);
                }
              }
            });
          });
        }
      } catch (err) {
        reject(err);
      }
    });
    const reader = readableStream.getReader();
    const decoder = new TextDecoder();
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            resolve({ convId, imageUrls });
            break;
          }
          parser.feed(decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        reject(err);
      } finally {
        reader.releaseLock();
      }
    })();
  });
}
__name(receiveImages, "receiveImages");

// src/adapters.ts
var MODEL_NAME2 = "glm";
function convertClaudeToGLM(messages, system) {
  const glmMessages = [];
  let systemText;
  if (system) {
    if (Array.isArray(system)) {
      systemText = system.filter((item) => item.type === "text").map((item) => item.text).join("\n");
    } else if (typeof system === "string") {
      systemText = system;
    }
  }
  if (systemText) {
    glmMessages.push({ role: "system", content: systemText });
  }
  for (const msg of messages) {
    if (msg.role === "user") {
      let content = msg.content ?? "";
      if (isArray(content)) {
        const texts = [];
        for (const item of content) {
          if (item.type === "text")
            texts.push(item.text);
          if (item.type === "tool_result") {
            texts.push(`\u5DE5\u5177\u8C03\u7528\u7ED3\u679C (${item.tool_use_id || ""}):
${typeof item.content === "string" ? item.content : JSON.stringify(item.content)}`);
          }
        }
        content = texts.join("\n");
      }
      glmMessages.push({ role: "user", content });
    } else if (msg.role === "assistant") {
      let content = msg.content ?? "";
      if (isArray(content)) {
        const texts = [];
        for (const item of content) {
          if (item.type === "text")
            texts.push(item.text);
          if (item.type === "tool_use") {
            texts.push(`{"tool_calls":[{"name":"${item.name}","arguments":${JSON.stringify(item.input || {})}}]}`);
          }
        }
        content = texts.join("\n");
      }
      glmMessages.push({ role: "assistant", content });
    }
  }
  return glmMessages;
}
__name(convertClaudeToGLM, "convertClaudeToGLM");
function convertClaudeToolsToOpenAI(tools) {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema || tool.parameters || {}
    }
  }));
}
__name(convertClaudeToolsToOpenAI, "convertClaudeToolsToOpenAI");
function convertGLMToClaude(glmResponse) {
  const message = glmResponse.choices[0].message;
  const content = [];
  if (message.content) {
    content.push({ type: "text", text: message.content });
  }
  if (message.tool_calls) {
    for (const tc of message.tool_calls) {
      content.push({
        type: "tool_use",
        id: tc.id,
        name: tc.function.name,
        input: typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments
      });
    }
  }
  let stopReason = "end_turn";
  if (glmResponse.choices[0].finish_reason === "tool_calls")
    stopReason = "tool_use";
  else if (glmResponse.choices[0].finish_reason !== "stop")
    stopReason = "max_tokens";
  return {
    id: glmResponse.id || uuid(),
    type: "message",
    role: "assistant",
    content,
    model: MODEL_NAME2,
    stop_reason: stopReason,
    stop_sequence: null,
    usage: {
      input_tokens: glmResponse.usage?.prompt_tokens || 0,
      output_tokens: glmResponse.usage?.completion_tokens || 0
    }
  };
}
__name(convertGLMToClaude, "convertGLMToClaude");
function convertGLMStreamToClaude(glmStream) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const reader = glmStream.getReader();
      const decoder = new TextDecoder();
      const messageId = uuid();
      let isFirstChunk = true;
      let textBlockStarted = false;
      let toolBlockIndex = -1;
      let toolBlockStarted = false;
      let sentToolIds = /* @__PURE__ */ new Set();
      let streamClosed = false;
      const safeEnqueue = /* @__PURE__ */ __name((data) => {
        if (!streamClosed)
          controller.enqueue(data);
      }, "safeEnqueue");
      const sendMessageStart = /* @__PURE__ */ __name(() => {
        safeEnqueue(encoder.encode(`event: message_start
data: ${JSON.stringify({
          type: "message_start",
          message: {
            id: messageId,
            type: "message",
            role: "assistant",
            content: [],
            model: MODEL_NAME2,
            stop_reason: null,
            stop_sequence: null,
            usage: { input_tokens: 0, output_tokens: 0 }
          }
        })}

`));
      }, "sendMessageStart");
      const sendTextBlockStart = /* @__PURE__ */ __name(() => {
        if (textBlockStarted)
          return;
        textBlockStarted = true;
        safeEnqueue(encoder.encode(`event: content_block_start
data: ${JSON.stringify({
          type: "content_block_start",
          index: 0,
          content_block: { type: "text", text: "" }
        })}

`));
      }, "sendTextBlockStart");
      const sendTextDelta = /* @__PURE__ */ __name((text) => {
        safeEnqueue(encoder.encode(`event: content_block_delta
data: ${JSON.stringify({
          type: "content_block_delta",
          index: 0,
          delta: { type: "text_delta", text }
        })}

`));
      }, "sendTextDelta");
      const sendTextBlockStop = /* @__PURE__ */ __name(() => {
        if (!textBlockStarted)
          return;
        textBlockStarted = false;
        safeEnqueue(encoder.encode(`event: content_block_stop
data: ${JSON.stringify({
          type: "content_block_stop",
          index: 0
        })}

`));
      }, "sendTextBlockStop");
      const sendToolBlockStart = /* @__PURE__ */ __name((toolCall, idx) => {
        if (sentToolIds.has(toolCall.id))
          return;
        sentToolIds.add(toolCall.id);
        toolBlockIndex = idx;
        toolBlockStarted = true;
        safeEnqueue(encoder.encode(`event: content_block_start
data: ${JSON.stringify({
          type: "content_block_start",
          index: idx,
          content_block: {
            type: "tool_use",
            id: toolCall.id,
            name: toolCall.function?.name || "",
            input: {}
          }
        })}

`));
      }, "sendToolBlockStart");
      const sendToolDelta = /* @__PURE__ */ __name((partialJson, idx) => {
        safeEnqueue(encoder.encode(`event: content_block_delta
data: ${JSON.stringify({
          type: "content_block_delta",
          index: idx,
          delta: { type: "input_json_delta", partial_json: partialJson }
        })}

`));
      }, "sendToolDelta");
      const sendToolBlockStop = /* @__PURE__ */ __name((idx) => {
        if (!toolBlockStarted)
          return;
        toolBlockStarted = false;
        safeEnqueue(encoder.encode(`event: content_block_stop
data: ${JSON.stringify({
          type: "content_block_stop",
          index: idx
        })}

`));
      }, "sendToolBlockStop");
      const sendMessageStop = /* @__PURE__ */ __name((stopReason) => {
        if (streamClosed)
          return;
        streamClosed = true;
        safeEnqueue(encoder.encode(`event: message_delta
data: ${JSON.stringify({
          type: "message_delta",
          delta: { stop_reason: stopReason, stop_sequence: null },
          usage: { output_tokens: 1 }
        })}

`));
        safeEnqueue(encoder.encode(`event: message_stop
data: ${JSON.stringify({
          type: "message_stop"
        })}

`));
        controller.close();
      }, "sendMessageStop");
      const parser = createParser((event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.choices && data.choices[0]) {
            const delta = data.choices[0].delta;
            const finishReason = data.choices[0].finish_reason;
            if (isFirstChunk) {
              sendMessageStart();
              isFirstChunk = false;
            }
            if (delta.content) {
              sendTextBlockStart();
              sendTextDelta(delta.content);
            }
            if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
              delta.tool_calls.forEach((tc, i) => {
                const idx = textBlockStarted ? i + 1 : i;
                sendToolBlockStart(tc, idx);
                const args = typeof tc.function?.arguments === "string" ? tc.function.arguments : JSON.stringify(tc.function?.arguments || {});
                sendToolDelta(args, idx);
                sendToolBlockStop(idx);
              });
            }
            if (finishReason) {
              let stopReason = "end_turn";
              if (finishReason === "tool_calls")
                stopReason = "tool_use";
              else if (finishReason !== "stop")
                stopReason = "max_tokens";
              sendTextBlockStop();
              if (toolBlockStarted) {
                sendToolBlockStop(toolBlockIndex);
              }
              sendMessageStop(stopReason);
            }
          }
        } catch (err) {
          controller.error(err);
        }
      });
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (!isFirstChunk) {
              sendTextBlockStop();
              if (toolBlockStarted)
                sendToolBlockStop(toolBlockIndex);
              sendMessageStop("end_turn");
            } else {
              controller.close();
            }
            break;
          }
          parser.feed(decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    }
  });
}
__name(convertGLMStreamToClaude, "convertGLMStreamToClaude");
async function createClaudeCompletion(model, messages, system, refreshToken, stream = false, conversationId, tools) {
  const glmMessages = convertClaudeToGLM(messages, system);
  const openaiTools = tools && tools.length > 0 ? convertClaudeToolsToOpenAI(tools) : void 0;
  if (stream) {
    const glmStream = await createCompletionStream(glmMessages, refreshToken, model, conversationId, 0, openaiTools);
    return convertGLMStreamToClaude(glmStream);
  } else {
    const glmResponse = await createCompletion(glmMessages, refreshToken, model, conversationId, 0, openaiTools);
    return convertGLMToClaude(glmResponse);
  }
}
__name(createClaudeCompletion, "createClaudeCompletion");
function convertGeminiToGLM(contents, systemInstruction) {
  const glmMessages = [];
  let systemText = "";
  if (systemInstruction) {
    if (typeof systemInstruction === "string") {
      systemText = systemInstruction;
    } else if (systemInstruction.parts) {
      systemText = systemInstruction.parts.filter((part) => part.text).map((part) => part.text).join("\n");
    }
  }
  let systemPrepended = false;
  for (const content of contents) {
    const role = content.role === "model" ? "assistant" : "user";
    let text = "";
    if (content.parts && Array.isArray(content.parts)) {
      text = content.parts.filter((part) => part.text).map((part) => part.text).join("\n");
    }
    if (role === "user" && systemText && !systemPrepended) {
      text = `${systemText}

${text}`;
      systemPrepended = true;
    }
    glmMessages.push({ role, content: text });
  }
  return glmMessages;
}
__name(convertGeminiToGLM, "convertGeminiToGLM");
function convertGLMToGemini(glmResponse) {
  const content = glmResponse.choices[0].message.content;
  return {
    candidates: [{
      content: { parts: [{ text: content }], role: "model" },
      finishReason: glmResponse.choices[0].finish_reason === "stop" ? "STOP" : "MAX_TOKENS",
      index: 0,
      safetyRatings: []
    }],
    usageMetadata: {
      promptTokenCount: glmResponse.usage?.prompt_tokens || 0,
      candidatesTokenCount: glmResponse.usage?.completion_tokens || 0,
      totalTokenCount: glmResponse.usage?.total_tokens || 0
    }
  };
}
__name(convertGLMToGemini, "convertGLMToGemini");
function convertGLMStreamToGemini(glmStream) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const reader = glmStream.getReader();
      const decoder = new TextDecoder();
      const parser = createParser((event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.choices && data.choices[0]) {
            const delta = data.choices[0].delta;
            if (delta.content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                candidates: [{ content: { parts: [{ text: delta.content }], role: "model" }, finishReason: null, index: 0, safetyRatings: [] }]
              })}

`));
            }
            if (data.choices[0].finish_reason) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                candidates: [{ content: { parts: [{ text: "" }], role: "model" }, finishReason: "STOP", index: 0, safetyRatings: [] }],
                usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 }
              })}

`));
              controller.close();
            }
          }
        } catch (err) {
          controller.error(err);
        }
      });
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }
          parser.feed(decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    }
  });
}
__name(convertGLMStreamToGemini, "convertGLMStreamToGemini");
async function createGeminiCompletion(model, contents, systemInstruction, refreshToken, stream = false, conversationId) {
  const glmMessages = convertGeminiToGLM(contents, systemInstruction);
  if (stream) {
    const glmStream = await createCompletionStream(glmMessages, refreshToken, model, conversationId);
    return convertGLMStreamToGemini(glmStream);
  } else {
    const glmResponse = await createCompletion(glmMessages, refreshToken, model, conversationId);
    return convertGLMToGemini(glmResponse);
  }
}
__name(createGeminiCompletion, "createGeminiCompletion");

// src/index.ts
var WELCOME_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GLM Free API Neo</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 60px auto; padding: 0 20px; color: #333; line-height: 1.6; }
  h1 { color: #1a1a1a; }
  code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
  .endpoint { margin: 12px 0; padding: 12px; background: #fafafa; border-left: 4px solid #007acc; border-radius: 4px; }
</style>
</head>
<body>
<h1>GLM Free API Neo</h1>
<p>\u96F6\u914D\u7F6E\u3001\u65E0 KV\u3001\u65E0\u7BA1\u7406\u754C\u9762\u7684 GLM API \u4EE3\u7406\u670D\u52A1\u3002</p>
<p>\u6BCF\u6B21\u8BF7\u6C42\u81EA\u52A8\u83B7\u53D6\u8BBF\u5BA2 Token\uFF0C\u65E0\u9700 API Key\uFF0C\u90E8\u7F72\u5373\u7528\u3002</p>

<h2>\u652F\u6301\u7684\u7AEF\u70B9</h2>
<div class="endpoint"><strong>POST</strong> <code>/v1/chat/completions</code> \u2014 OpenAI \u683C\u5F0F\u5BF9\u8BDD</div>
<div class="endpoint"><strong>POST</strong> <code>/v1/messages</code> \u2014 Claude \u683C\u5F0F\u5BF9\u8BDD</div>
<div class="endpoint"><strong>POST</strong> <code>/v1beta/models/...:generateContent</code> \u2014 Gemini \u683C\u5F0F\u5BF9\u8BDD</div>
<div class="endpoint"><strong>POST</strong> <code>/v1/images/generations</code> \u2014 AI \u7ED8\u56FE</div>
<div class="endpoint"><strong>POST</strong> <code>/v1/videos/generations</code> \u2014 \u89C6\u9891\u751F\u6210</div>
<div class="endpoint"><strong>GET</strong> <code>/v1/models</code> \u2014 \u6A21\u578B\u5217\u8868</div>

<h2>\u4F7F\u7528\u793A\u4F8B</h2>
<pre>curl http://localhost:8787/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"model":"glm-4-flash","messages":[{"role":"user","content":"\u4F60\u597D"}]}'</pre>

<p>\u65E0\u9700 API Key\uFF0C\u76F4\u63A5\u8C03\u7528\u5373\u53EF\u3002</p>
</body>
</html>`;
var DEFAULT_SIGN_SECRET = "8a1317a7468aa3ad86e997d08f3f31cb";
var SUPPORTED_MODELS = [
  { id: "glm5", name: "GLM-5", object: "model", owned_by: "glm-free-api-neo", description: "GLM-5 \u901A\u7528\u5BF9\u8BDD\u6A21\u578B" }
];
var GEMINI_MODELS = [
  { name: "models/gemini-1.5-pro", displayName: "Gemini 1.5 Pro", description: "Most capable model for complex reasoning tasks", inputTokenLimit: 2097152, outputTokenLimit: 8192, supportedGenerationMethods: ["generateContent", "streamGenerateContent"] },
  { name: "models/gemini-1.5-flash", displayName: "Gemini 1.5 Flash", description: "Fast model for high throughput", inputTokenLimit: 1048576, outputTokenLimit: 8192, supportedGenerationMethods: ["generateContent", "streamGenerateContent"] },
  { name: "models/gemini-pro", displayName: "Gemini Pro", description: "Previous generation model", inputTokenLimit: 32768, outputTokenLimit: 2048, supportedGenerationMethods: ["generateContent", "streamGenerateContent"] },
  { name: "models/glm-5", displayName: "GLM-5", description: "GLM-5 chat model via adapter", inputTokenLimit: 32768, outputTokenLimit: 8192, supportedGenerationMethods: ["generateContent", "streamGenerateContent"] }
];
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "*"
  };
}
__name(corsHeaders, "corsHeaders");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ code: -1, message, data: null }, status);
}
__name(errorResponse, "errorResponse");
function sseResponse(stream) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      ...corsHeaders()
    }
  });
}
__name(sseResponse, "sseResponse");
async function generateChatGLMSign(secret) {
  const now = Date.now().toString();
  const length = now.length;
  const digits = now.split("").map((char) => Number(char));
  const checksum = (digits.reduce((sum, value) => sum + value, 0) - digits[length - 2]) % 10;
  const timestamp2 = now.substring(0, length - 2) + checksum + now.substring(length - 1, length);
  const nonce = uuid(false);
  const sign = await md5(`${timestamp2}-${nonce}-${secret}`);
  return { timestamp: timestamp2, nonce, sign };
}
__name(generateChatGLMSign, "generateChatGLMSign");
async function requestGuestRefreshToken(env) {
  const signSecret2 = env.SIGN_SECRET || DEFAULT_SIGN_SECRET;
  const sign = await generateChatGLMSign(signSecret2);
  const response = await fetch("https://chatglm.cn/chatglm/user-api/guest/access", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      "App-Name": "chatglm",
      "X-Device-Id": uuid(false),
      "X-Request-Id": uuid(false),
      "X-App-Platform": "pc",
      "X-App-Version": "0.0.1",
      "X-App-fr": "browser",
      "X-Lang": "zh-CN",
      "X-Exp-Groups": "",
      "X-Device-Model": "",
      "X-Device-Brand": "",
      "X-Timestamp": sign.timestamp,
      "X-Nonce": sign.nonce,
      "X-Sign": sign.sign
    },
    body: "{}"
  });
  const rawText = await response.text();
  let data = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`[Neo] guest/access \u8FD4\u56DE\u4E86\u975E JSON \u5185\u5BB9: ${rawText.slice(0, 200)}`);
  }
  const success = data?.status === 0 || data?.code === 0 || data?.message === "success";
  if (!response.ok || !success) {
    throw new Error(`[Neo] \u83B7\u53D6\u6E38\u5BA2 token \u5931\u8D25: ${data?.message || response.statusText}`);
  }
  const result = data?.result;
  if (!result?.refresh_token || !result?.access_token || !result?.user_id) {
    throw new Error("[Neo] guest/access \u672A\u8FD4\u56DE\u5B8C\u6574 token \u4FE1\u606F");
  }
  return {
    refreshToken: result.refresh_token,
    accessToken: result.access_token,
    userId: result.user_id
  };
}
__name(requestGuestRefreshToken, "requestGuestRefreshToken");
async function authenticate(env) {
  const guest = await requestGuestRefreshToken(env);
  return guest.refreshToken;
}
__name(authenticate, "authenticate");
async function handleChatCompletions(request, env) {
  const refreshToken = await authenticate(env);
  const body = await request.json();
  if (!Array.isArray(body.messages))
    throw new Error("messages must be an array");
  const { model, conversation_id: convId, messages, stream, tools, tool_choice } = body;
  if (stream) {
    const glmStream = await createCompletionStream(messages, refreshToken, model, convId, 0, tools);
    return sseResponse(glmStream);
  } else {
    const result = await createCompletion(messages, refreshToken, model, convId, 0, tools);
    return jsonResponse(result);
  }
}
__name(handleChatCompletions, "handleChatCompletions");
async function handleClaudeMessages(request, env) {
  const refreshToken = await authenticate(env);
  const body = await request.json();
  if (!Array.isArray(body.messages))
    throw new Error("messages must be an array");
  const { model, messages, system, stream, conversation_id: convId, tools } = body;
  const result = await createClaudeCompletion(model, messages, system, refreshToken, stream, convId, tools);
  if (stream && result instanceof ReadableStream) {
    return sseResponse(result);
  }
  return jsonResponse(result);
}
__name(handleClaudeMessages, "handleClaudeMessages");
async function handleGeminiModels() {
  return jsonResponse({ models: GEMINI_MODELS });
}
__name(handleGeminiModels, "handleGeminiModels");
async function handleGeminiGenerateContent(request, path, env) {
  const refreshToken = await authenticate(env);
  const body = await request.json();
  const modelMatch = path.match(/^\/v1beta\/models\/(.+):generateContent$/);
  const model = modelMatch ? modelMatch[1] : "gemini-pro";
  const { contents, systemInstruction, conversation_id: convId } = body;
  const result = await createGeminiCompletion(model, contents, systemInstruction, refreshToken, false, convId);
  return jsonResponse(result);
}
__name(handleGeminiGenerateContent, "handleGeminiGenerateContent");
async function handleGeminiStreamGenerateContent(request, path, env) {
  const refreshToken = await authenticate(env);
  const body = await request.json();
  const modelMatch = path.match(/^\/v1beta\/models\/(.+):streamGenerateContent$/);
  const model = modelMatch ? modelMatch[1] : "gemini-pro";
  const { contents, systemInstruction, conversation_id: convId } = body;
  const result = await createGeminiCompletion(model, contents, systemInstruction, refreshToken, true, convId);
  if (result instanceof ReadableStream) {
    return sseResponse(result);
  }
  return jsonResponse(result);
}
__name(handleGeminiStreamGenerateContent, "handleGeminiStreamGenerateContent");
async function handleImageGenerations(request, env) {
  const refreshToken = await authenticate(env);
  const body = await request.json();
  if (!isString(body.prompt))
    throw new Error("prompt must be a string");
  const prompt = body.prompt;
  const responseFormat = defaultTo(body.response_format, "url");
  const assistantId = /^[a-z0-9]{24,}$/.test(body.model) ? body.model : void 0;
  const imageUrls = await generateImages(assistantId, prompt, refreshToken);
  let data;
  if (responseFormat == "b64_json") {
    data = (await Promise.all(imageUrls.map((url) => fetchBase64(url)))).map((b64) => ({ b64_json: b64 }));
  } else {
    data = imageUrls.map((url) => ({ url }));
  }
  return jsonResponse({ created: unixTimestamp(), data });
}
__name(handleImageGenerations, "handleImageGenerations");
async function fetchBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return "data:image/png;base64," + btoa(binary);
}
__name(fetchBase64, "fetchBase64");
async function handleVideoGenerations(request, env) {
  const refreshToken = await authenticate(env);
  const body = await request.json();
  if (!isString(body.prompt))
    throw new Error("prompt must be a string");
  const {
    model,
    conversation_id: convId,
    prompt,
    image_url: imageUrl,
    video_style: videoStyle = "",
    emotional_atmosphere: emotionalAtmosphere = "",
    mirror_mode: mirrorMode = "",
    audio_id: audioId
  } = body;
  const validStyles = ["\u5361\u901A3D", "\u9ED1\u767D\u8001\u7167\u7247", "\u6CB9\u753B", "\u7535\u5F71\u611F"];
  const validEmotions = ["\u6E29\u99A8\u548C\u8C10", "\u751F\u52A8\u6D3B\u6CFC", "\u7D27\u5F20\u523A\u6FC0", "\u51C4\u51C9\u5BC2\u5BDE"];
  const validMirrors = ["\u6C34\u5E73", "\u5782\u76F4", "\u63A8\u8FD1", "\u62C9\u8FDC"];
  if (videoStyle && !validStyles.includes(videoStyle))
    throw new Error(`video_style must be one of ${validStyles.join("/")}`);
  if (emotionalAtmosphere && !validEmotions.includes(emotionalAtmosphere))
    throw new Error(`emotional_atmosphere must be one of ${validEmotions.join("/")}`);
  if (mirrorMode && !validMirrors.includes(mirrorMode))
    throw new Error(`mirror_mode must be one of ${validMirrors.join("/")}`);
  const result = await generateVideos(model, prompt, refreshToken, {
    imageUrl,
    videoStyle,
    emotionalAtmosphere,
    mirrorMode,
    audioId
  }, convId);
  return jsonResponse({
    created: unixTimestamp(),
    data: result.map((item) => ({ url: item.url }))
  });
}
__name(handleVideoGenerations, "handleVideoGenerations");
async function handleModels() {
  return jsonResponse({ data: SUPPORTED_MODELS });
}
__name(handleModels, "handleModels");
var src_default = {
  async fetch(request, env, _ctx) {
    if (env.SIGN_SECRET)
      setSignSecret(env.SIGN_SECRET);
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    try {
      let response;
      if (path === "/" && request.method === "GET") {
        response = new Response(WELCOME_HTML, {
          headers: { "Content-Type": "text/html", ...corsHeaders() }
        });
      } else if (path === "/v1/chat/completions" && request.method === "POST") {
        response = await handleChatCompletions(request, env);
      } else if (path === "/v1/messages" && request.method === "POST") {
        response = await handleClaudeMessages(request, env);
      } else if (path === "/v1beta/models" && request.method === "GET") {
        response = await handleGeminiModels();
      } else if (path.match(/^\/v1beta\/models\/[^:]+:generateContent$/) && request.method === "POST") {
        response = await handleGeminiGenerateContent(request, path, env);
      } else if (path.match(/^\/v1beta\/models\/[^:]+:streamGenerateContent$/) && request.method === "POST") {
        response = await handleGeminiStreamGenerateContent(request, path, env);
      } else if (path === "/v1/images/generations" && request.method === "POST") {
        response = await handleImageGenerations(request, env);
      } else if (path === "/v1/videos/generations" && request.method === "POST") {
        response = await handleVideoGenerations(request, env);
      } else if (path === "/v1/models" && request.method === "GET") {
        response = await handleModels();
      } else if (path === "/ping" && request.method === "GET") {
        response = new Response("pong", { headers: corsHeaders() });
      } else {
        const message = `[\u8BF7\u6C42\u6709\u8BEF]: \u6B63\u786E\u8BF7\u6C42\u4E3A POST -> /v1/chat/completions\uFF0C\u5F53\u524D\u8BF7\u6C42\u4E3A ${request.method} -> ${path} \u8BF7\u7EA0\u6B63`;
        response = errorResponse(message, 404);
      }
      return response;
    } catch (err) {
      console.error(err);
      return errorResponse(err.message || "Internal error", 500);
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-QxhcPi/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-QxhcPi/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
