(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,67585,(e,t,l)=>{"use strict";Object.defineProperty(l,"__esModule",{value:!0}),Object.defineProperty(l,"BailoutToCSR",{enumerable:!0,get:function(){return a}});let s=e.r(32061);function a({reason:e,children:t}){if("u"<typeof window)throw Object.defineProperty(new s.BailoutToCSRError(e),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0});return t}},9885,(e,t,l)=>{"use strict";function s(e){return e.split("/").map(e=>encodeURIComponent(e)).join("/")}Object.defineProperty(l,"__esModule",{value:!0}),Object.defineProperty(l,"encodeURIPath",{enumerable:!0,get:function(){return s}})},52157,(e,t,l)=>{"use strict";Object.defineProperty(l,"__esModule",{value:!0}),Object.defineProperty(l,"PreloadChunks",{enumerable:!0,get:function(){return n}});let s=e.r(43476),a=e.r(74080),o=e.r(63599),r=e.r(9885),i=e.r(43369);function n({moduleIds:e}){if("u">typeof window)return null;let t=o.workAsyncStorage.getStore();if(void 0===t)return null;let l=[];if(t.reactLoadableManifest&&e){let s=t.reactLoadableManifest;for(let t of e){if(!s[t])continue;let e=s[t].files;l.push(...e)}}if(0===l.length)return null;let d=(0,i.getAssetTokenQuery)();return(0,s.jsx)(s.Fragment,{children:l.map(e=>{let l=`${t.assetPrefix}/_next/${(0,r.encodeURIPath)(e)}${d}`;return e.endsWith(".css")?(0,s.jsx)("link",{precedence:"dynamic",href:l,rel:"stylesheet",as:"style",nonce:t.nonce},e):((0,a.preload)(l,{as:"script",fetchPriority:"low",nonce:t.nonce}),null)})})}},69093,(e,t,l)=>{"use strict";Object.defineProperty(l,"__esModule",{value:!0}),Object.defineProperty(l,"default",{enumerable:!0,get:function(){return d}});let s=e.r(43476),a=e.r(71645),o=e.r(67585),r=e.r(52157);function i(e){return{default:e&&"default"in e?e.default:e}}let n={loader:()=>Promise.resolve(i(()=>null)),loading:null,ssr:!0},d=function(e){let t={...n,...e},l=(0,a.lazy)(()=>t.loader().then(i)),d=t.loading;function c(e){let i=d?(0,s.jsx)(d,{isLoading:!0,pastDelay:!0,error:null}):null,n=!t.ssr||!!t.loading,c=n?a.Suspense:a.Fragment,u=t.ssr?(0,s.jsxs)(s.Fragment,{children:["u"<typeof window?(0,s.jsx)(r.PreloadChunks,{moduleIds:t.modules}):null,(0,s.jsx)(l,{...e})]}):(0,s.jsx)(o.BailoutToCSR,{reason:"next/dynamic",children:(0,s.jsx)(l,{...e})});return(0,s.jsx)(c,{...n?{fallback:i}:{},children:u})}return c.displayName="LoadableComponent",c}},70703,(e,t,l)=>{"use strict";Object.defineProperty(l,"__esModule",{value:!0}),Object.defineProperty(l,"default",{enumerable:!0,get:function(){return a}});let s=e.r(55682)._(e.r(69093));function a(e,t){let l={};"function"==typeof e&&(l.loader=e);let a={...l,...t};return(0,s.default)({...a,modules:a.loadableGenerated?.modules})}("function"==typeof l.default||"object"==typeof l.default&&null!==l.default)&&void 0===l.default.__esModule&&(Object.defineProperty(l.default,"__esModule",{value:!0}),Object.assign(l.default,l),t.exports=l.default)},31713,e=>{"use strict";var t=e.i(43476),l=e.i(70703),s=e.i(71645);let a=[{q:"What is an EMG?",a:"Electromyography (EMG) measures the electrical activity produced by skeletal muscles during contraction. When a motor neuron fires, it triggers an action potential that propagates along the muscle fiber — EMG captures the summation of many such potentials as a microvolt-level electrical signal detectable at the skin surface.",tag:"Physiology"},{q:"What exactly are we measuring?",a:"We are detecting the summation of action potentials at the Neuromuscular Junction (NMJ) as you flex your forearm. Each motor unit (one neuron + all muscle fibers it innervates) fires synchronously, and the cumulative electrical field of hundreds of motor units is what the AD8232 differential amplifier picks up.",tag:"Signal"},{q:"Why the ESP32?",a:"The ESP32 provides built-in Bluetooth Low Energy (BLE), allowing us to convert biological signals into standard HID (Human Interface Device) inputs — like a keyboard keypress — without any wires to the host computer. It also has a 12-bit ADC and sufficient processing power to apply a simple threshold algorithm in real time.",tag:"Hardware"},{q:"Why use an ECG kit for EMG?",a:"Both ECG and EMG utilize differential amplifiers to detect microvolt-level changes in bioelectric potential. For a simple binary 'squeeze' trigger, the AD8232's instrumentation amplifier and bandpass filtering (0.5–40 Hz) is more than sufficient. It's also inexpensive (<$8) and widely available, making it ideal for open-source outreach demos.",tag:"Hardware"},{q:"Is it safe?",a:"Yes. The circuit operates at 3.3 V logic level and senses only — it does not pass current through the body. The AD8232 includes galvanic isolation by design. Electrode impedances and the differential measurement topology reject common-mode noise (like 60 Hz mains hum), and there is no therapeutic or stimulation component whatsoever.",tag:"Safety"},{q:"Can I build this myself?",a:"Absolutely — it's fully open-source. The total BOM is under $25: an ESP32 dev board (~$5), an AD8232 ECG module (~$8), three snap electrodes (~$2), and jumper wires. The firmware is Arduino C++ and the repository linked below includes schematics, code, and a step-by-step build guide.",tag:"DIY"}],o={Physiology:{bg:"#FFE4EC",text:"#c0446a"},Signal:{bg:"#D6E8FB",text:"#2563eb"},Hardware:{bg:"#e8f5e9",text:"#2e7d32"},Safety:{bg:"#fff3e0",text:"#e65100"},DIY:{bg:"#f3e8ff",text:"#7c3aed"}};function r(){let[e,l]=(0,s.useState)(null);return(0,t.jsx)("div",{className:"flex flex-col gap-3",children:a.map((s,a)=>{let r=e===a,i=o[s.tag]??{bg:"#eee",text:"#555"};return(0,t.jsxs)("div",{className:"rounded-2xl overflow-hidden transition-all duration-200",style:{border:`1.5px solid ${r?"var(--neuro-blue)":"#e5e4d8"}`,background:r?"#f8f7ff":"white",boxShadow:r?"0 4px 18px rgba(74,144,226,0.10)":"0 1px 4px rgba(0,0,0,0.05)"},children:[(0,t.jsxs)("button",{onClick:()=>l(e===a?null:a),className:"w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer",children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("span",{className:"text-xs font-semibold px-2.5 py-0.5 rounded-full",style:{background:i.bg,color:i.text},children:s.tag}),(0,t.jsx)("span",{className:"font-medium text-sm",style:{color:"var(--dark)"},children:s.q})]}),(0,t.jsx)("svg",{className:"shrink-0 ml-3 transition-transform duration-300",style:{transform:r?"rotate(180deg)":"rotate(0deg)",color:"var(--neuro-blue)"},width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",strokeLinecap:"round",strokeLinejoin:"round",children:(0,t.jsx)("polyline",{points:"6 9 12 15 18 9"})})]}),(0,t.jsx)("div",{className:`faq-content ${r?"open":""}`,children:(0,t.jsx)("p",{className:"px-5 pb-5 text-sm leading-relaxed",style:{color:"#444455"},children:s.a})})]},a)})})}function i({code:e,language:l="cpp",filename:a}){var o,r;let n,d,c,[u,p]=(0,s.useState)(!1),h=async()=>{await navigator.clipboard.writeText(e),p(!0),setTimeout(()=>p(!1),2e3)};return(0,t.jsxs)("div",{className:"rounded-2xl overflow-hidden",style:{background:"#0d1117",border:"1.5px solid #30363d",boxShadow:"0 4px 24px rgba(0,0,0,0.25)"},children:[(0,t.jsxs)("div",{className:"flex items-center justify-between px-4 py-2.5",style:{background:"#161b22",borderBottom:"1px solid #30363d"},children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsxs)("div",{className:"flex gap-1.5",children:[(0,t.jsx)("div",{className:"w-3 h-3 rounded-full",style:{background:"#ff5f57"}}),(0,t.jsx)("div",{className:"w-3 h-3 rounded-full",style:{background:"#ffbd2e"}}),(0,t.jsx)("div",{className:"w-3 h-3 rounded-full",style:{background:"#28c840"}})]}),a&&(0,t.jsx)("span",{className:"text-xs font-mono",style:{color:"#8b949e"},children:a}),(0,t.jsx)("span",{className:"text-xs px-2 py-0.5 rounded font-mono",style:{background:"#21262d",color:"#4a90e2"},children:l})]}),(0,t.jsx)("button",{onClick:h,className:"flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg transition-all duration-150 cursor-pointer font-medium",style:{background:u?"#1f6feb22":"#21262d",color:u?"#4a90e2":"#8b949e",border:`1px solid ${u?"#4a90e2":"#30363d"}`},children:u?(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",children:(0,t.jsx)("polyline",{points:"20 6 9 17 4 12"})}),"Copied"]}):(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[(0,t.jsx)("rect",{x:"9",y:"9",width:"13",height:"13",rx:"2",ry:"2"}),(0,t.jsx)("path",{d:"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"})]}),"Copy"]})})]}),(0,t.jsx)("pre",{className:"overflow-x-auto p-5 text-sm leading-relaxed",style:{fontFamily:"'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace"},children:(0,t.jsx)("code",{dangerouslySetInnerHTML:{__html:(o=e,r=l,n=e=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),d=(e,t=!1)=>`<span style="color:${e}${t?";font-style:italic":""}">`,c=new Set(["void","int","float","bool","true","false","if","else","while","for","return","const","String","uint8_t","uint16_t","long","unsigned","class","private","public","new","delete","nullptr","auto","static"]),o.split("\n").map((e,t)=>{let l,s="cpp"===r||"c"===r?function(e){let t=[],l=0;for(;l<e.length;){if('"'===e[l]){let s=l+1;for(;s<e.length&&'"'!==e[s];)s++;t.push({kind:"str",val:e.slice(l,s+1)}),l=s+1;continue}if("/"===e[l]&&"/"===e[l+1]){t.push({kind:"cmt",val:e.slice(l)});break}t.push({kind:"raw",val:e[l]}),l++}let s=[];for(let e of t)"raw"===e.kind&&s.at(-1)?.kind==="raw"?s[s.length-1].val+=e.val:s.push({...e});return s.map(({kind:e,val:t})=>"cmt"===e?`${d("#8b949e",!0)}${n(t)}</span>`:"str"===e?`${d("#a5d6ff")}${n(t)}</span>`:n(t).replace(/(\b(?:include|define|ifdef|ifndef|endif|pragma)\b)|([A-Za-z_]\w*)\s*(?=\()|(\b[A-Za-z_]\w*\b)|(\d+(?:\.\d+)?)|([#])/g,(e,t,l,s,a)=>t||"#include"===e||e.startsWith("#")?`${d("#ff7b72")}${e}</span>`:l?`${d("#d2a8ff")}${e}</span>`:s?c.has(s)?`${d("#ff7b72")}${s}</span>`:e:a?`${d("#79c0ff")}${a}</span>`:e)).join("")}(e):n(e);return`${l=t+1,`<span style="color:#444d56;user-select:none;margin-right:1.5em;display:inline-block;width:2em;text-align:right">${l}</span>`}${s}`}).join("\n"))}})})]})}let n=(0,l.default)(()=>e.A(70553),{loadableGenerated:{modules:[58719]},ssr:!1}),d=`/*
 * EMG BLE Spacebar — AD8232 + ESP32
 * Detects forearm muscle contraction and presses/holds spacebar over BLE.
 *
 * ═══════════════════════════════════════════════════════════
 * REQUIRED LIBRARY
 * ═══════════════════════════════════════════════════════════
 * Install "ESP32 BLE Keyboard" by T-vK via Arduino Library Manager,
 * or: https://github.com/T-vK/ESP32-BLE-Keyboard
 *
 * ═══════════════════════════════════════════════════════════
 * AD8232 WIRING  (AD8232 pin → ESP32 pin)
 * ═══════════════════════════════════════════════════════════
 *   3.3V   → 3.3V
 *   GND    → GND
 *   OUTPUT → GPIO 35  (ADC-only input, no internal pull-up needed)
 *   LO+    → GPIO 25  (lead-off detection, active HIGH when electrode off)
 *   LO-    → GPIO 26  (lead-off detection, active HIGH when electrode off)
 *   SDN    → 3.3V     (tie HIGH to keep chip enabled; LOW = shutdown)
 *
 * ═══════════════════════════════════════════════════════════
 * LED WIRING  (anode → GPIO, cathode → 220Ω resistor → GND)
 * ═══════════════════════════════════════════════════════════
 *   Green LED → GPIO 27  (squeeze / spacebar active)
 *   Red LED   → GPIO 14  (idle, leads-off, or BLE disconnected)
 *
 * ═══════════════════════════════════════════════════════════
 * TARE BUTTON
 * ═══════════════════════════════════════════════════════════
 *   One leg → GPIO 13
 *   Other leg → GND
 *   (internal pull-up is enabled in code — no external resistor needed)
 *
 * ═══════════════════════════════════════════════════════════
 * ELECTRODE PLACEMENT  (forearm squeeze / stress ball)
 * ═══════════════════════════════════════════════════════════
 * Sit with the squeezing arm relaxed, palm facing UP.
 * You are targeting the flexor digitorum superficialis — the big
 * muscle group on the inner forearm that fires when you grip.
 *
 *   RED electrode   (RA / IN+):
 *       Inner forearm, ~2 inches (5 cm) below the crease of the elbow,
 *       centered on the muscle belly. This is the "active" lead.
 *
 *   YELLOW electrode (LA / IN−):
 *       Inner forearm, ~4 inches (10 cm) below the elbow crease —
 *       roughly 2 inches distal from the RED electrode, same muscle belly.
 *       Differential pair: keep both on the same muscle, along its length.
 *
 *   GREEN electrode  (RL / reference / right-leg drive):
 *       Bony area where there is minimal muscle — good options:
 *         • Back of the wrist (dorsal side)
 *         • Lateral elbow (olecranon)
 *       This is the noise-rejection reference; placement is flexible.
 *
 * Electrode tips:
 *   - Clean skin with alcohol wipe and let dry before applying.
 *   - Press firmly; loose contact causes noise and false triggers.
 *   - Keep RED and YELLOW parallel to the muscle fiber direction.
 *
 * ═══════════════════════════════════════════════════════════
 * TUNING
 * ═══════════════════════════════════════════════════════════
 * Open Serial Monitor at 115200 baud. Watch the "envelope" value:
 *   - At rest it should hover near 0.
 *   - On a firm squeeze it should spike to 200–800+ (ADC units).
 * Adjust SQUEEZE_THRESHOLD so it sits comfortably above the resting
 * noise floor but below a light squeeze. Start at 150 and tune up/down.
 *
 * If the signal is noisy at rest, increase ENVELOPE_ALPHA slightly
 * (more smoothing) or lower it for faster response.
 */

#include <Arduino.h>
#include <HijelHID_BLEKeyboard.h>

// ── Pin definitions ────────────────────────────────────────────────────────────
static constexpr uint8_t PIN_EMG          = 35;  // AD8232 OUTPUT → ADC
static constexpr uint8_t PIN_LEAD_OFF_POS = 25;  // AD8232 LO+
static constexpr uint8_t PIN_LEAD_OFF_NEG = 26;  // AD8232 LO-
static constexpr uint8_t PIN_LED_GREEN    = 27;  // Squeeze indicator
static constexpr uint8_t PIN_LED_RED      = 14;  // Idle / error indicator
static constexpr uint8_t PIN_TARE_BTN     = 13;  // Active-low tare button

// ── Tunable parameters ─────────────────────────────────────────────────────────
static constexpr uint32_t SAMPLE_INTERVAL_US = 1000;   // 1 kHz
static constexpr float    ENVELOPE_ALPHA     = 0.05f;  // EMA smoothing [0–1]; lower = smoother
static constexpr uint16_t TARE_SAMPLES       = 500;    // Samples averaged during tare (~0.5 s)
static constexpr float    SQUEEZE_THRESHOLD  = 400.0f; // Envelope units above baseline → squeeze
static constexpr uint32_t DEBOUNCE_MS        = 50;     // Minimum dwell in each state (ms)

// ── Globals ────────────────────────────────────────────────────────────────────
HijelHID_BLEKeyboard keyboard;

float    baseline          = 2048.0f; // Default ADC mid-rail for 3.3 V supply
float    envelope          = 0.0f;
bool     squeezing         = false;
uint32_t lastStateChangeMs = 0;

// ── Forward declarations ───────────────────────────────────────────────────────
void performTare();
void setLEDs(bool green, bool red);
bool leadsOff();

// ── Helpers ────────────────────────────────────────────────────────────────────

bool leadsOff() {
  // LO+ or LO- goes HIGH when an electrode is not making good contact.
  return digitalRead(PIN_LEAD_OFF_POS) || digitalRead(PIN_LEAD_OFF_NEG);
}

void setLEDs(bool green, bool red) {
  digitalWrite(PIN_LED_GREEN, green ? HIGH : LOW);
  digitalWrite(PIN_LED_RED,   red   ? HIGH : LOW);
}

// Sample TARE_SAMPLES readings at rest to establish the DC baseline.
// Both LEDs light during the process, then turn off briefly as confirmation.
void performTare() {
  setLEDs(true, true);
  Serial.println("[TARE] Sampling baseline — hold still...");

  long sum = 0;
  for (uint16_t i = 0; i < TARE_SAMPLES; i++) {
    sum += analogRead(PIN_EMG);
    delayMicroseconds(SAMPLE_INTERVAL_US);
  }
  baseline = static_cast<float>(sum) / TARE_SAMPLES;
  envelope = 0.0f;

  Serial.printf("[TARE] Done. Baseline = %.1f\\n", baseline);
  setLEDs(false, false);
  delay(200); // brief off to signal completion
}

// ── Setup ──────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  pinMode(PIN_LEAD_OFF_POS, INPUT);
  pinMode(PIN_LEAD_OFF_NEG, INPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED,   OUTPUT);
  pinMode(PIN_TARE_BTN,  INPUT_PULLUP);

  analogReadResolution(12); // 12-bit ADC: values 0–4095

  keyboard.begin();

  // Red on while waiting for BLE host to connect
  setLEDs(false, true);
  Serial.println("[BLE] Advertising as \\"HijelHID KB\\" — connect from your device.");
}

// ── Main loop ──────────────────────────────────────────────────────────────────
void loop() {
  static uint32_t lastSampleUs = 0;
  static uint32_t lastPrintMs  = 0;

  // ── Tare button (active-low, held for at least 30 ms) ──────────────────────
  if (digitalRead(PIN_TARE_BTN) == LOW) {
    delay(30);
    if (digitalRead(PIN_TARE_BTN) == LOW) {
      performTare();
      while (digitalRead(PIN_TARE_BTN) == LOW); // wait for release
    }
  }

  // ── Rate-limit to SAMPLE_INTERVAL_US ───────────────────────────────────────
  uint32_t nowUs = micros();
  if (nowUs - lastSampleUs < SAMPLE_INTERVAL_US) return;
  lastSampleUs = nowUs;

  // ── Lead-off detection ─────────────────────────────────────────────────────
  if (leadsOff()) {
    if (squeezing && keyboard.isPaired()) {
      keyboard.releaseAll();
    }
    squeezing = false;
    setLEDs(false, true); // red: electrodes off
    return;
  }

  // ── EMG envelope detection ─────────────────────────────────────────────────
  static float sample = 2048.0f;
  sample = static_cast<float>(analogRead(PIN_EMG));
  float deviation = fabsf(sample - baseline);

  // Exponential moving average — builds a smooth amplitude envelope
  envelope = ENVELOPE_ALPHA * deviation + (1.0f - ENVELOPE_ALPHA) * envelope;

  // ── State machine with debounce ────────────────────────────────────────────
  bool     squeezingNow = (envelope > SQUEEZE_THRESHOLD);
  uint32_t nowMs        = millis();

  if (squeezingNow != squeezing && (nowMs - lastStateChangeMs) > DEBOUNCE_MS) {
    squeezing         = squeezingNow;
    lastStateChangeMs = nowMs;

    if (keyboard.isPaired()) {
      if (squeezing) {
        keyboard.press(KEY_SPACE);   // hold spacebar
      } else {
        keyboard.releaseAll();       // release spacebar
      }
    }
  }

  // Green = squeezing, Red = idle (only when BLE is connected and leads on)
  if (keyboard.isPaired()) {
    setLEDs(squeezing, !squeezing);
  } else {
    // Slowly blink red while waiting for BLE connection
    bool blink = ((nowMs / 500) % 2 == 0);
    setLEDs(false, blink);
  }

  // ── Serial debug ~10 Hz ────────────────────────────────────────────────────
  if (nowMs - lastPrintMs > 100) {
    lastPrintMs = nowMs;
    Serial.printf(">baseline:%.0f\\n>sample:%.0f\\n>envelope:%.1f\\n>threshold:%.0f\\n>squeeze:%d\\n",
                  baseline, sample, envelope, baseline + SQUEEZE_THRESHOLD, (int)squeezing);
  }
}`,c=[{name:"ESP32 Dev Board",desc:"Dual-core 240 MHz, Wi-Fi + Bluetooth 5.0, 12-bit ADC — the brains of the build",price:"~$10",link:"https://www.amazon.com/Development-AYWHP-ESP-WROOM-32-Bluetooth-Compatible/dp/B0DG8JFY3C",color:"#4A90E2"},{name:"Breadboard + Jumper Wires",desc:"830-point breadboard with assorted male-to-male jumper wires for prototyping",price:"~$8",link:"https://www.amazon.com/HUAREW-Breadboard-Jumper-Include-Points/dp/B09VKYLYN7",color:"#34d399"},{name:"USB-C to USB-C Cable",desc:"Amazon Basics certified cable — for programming and powering the ESP32",price:"~$8",link:"https://www.amazon.com/Amazon-Basics-Charger-480Mbps-Certified/dp/B01GGKYZQM",color:"#a78bfa"},{name:"AD8232 EMG/ECG Sensor",desc:"Instrumentation amp module with 3 electrode leads — measures muscle signals",price:"~$10",link:"https://www.aliexpress.us/item/3256810304860653.html",color:"#FFB7C5"}],u=Array.from({length:20},(e,t)=>{let l,s=(l=7919*t+42,()=>((l=1664525*l+0x3c6ef35f|0)>>>0)/0xffffffff);return{size:Math.round(4*s()+1),left:Math.round(100*s()),top:Math.round(100*s()),pink:t%3==0,opacity:Math.round((.3+.4*s())*100)/100}}),p=[{id:"game",label:"Brain-Bird",icon:"🧠"},{id:"faq",label:"FAQ",icon:"?"},{id:"build",label:"Build Guide",icon:"⚙"}];e.s(["default",0,function(){let[e,l]=(0,s.useState)("game");return(0,t.jsxs)("div",{className:"min-h-screen",style:{background:"var(--cream)"},children:[(0,t.jsxs)("header",{className:"relative overflow-hidden",style:{background:"linear-gradient(135deg, #1a1a2e 0%, #0f3460 60%, #16213e 100%)"},children:[(0,t.jsx)("div",{className:"absolute inset-0 pointer-events-none select-none","aria-hidden":"true",children:u.map((e,l)=>(0,t.jsx)("div",{className:"absolute rounded-full",style:{width:e.size,height:e.size,left:`${e.left}%`,top:`${e.top}%`,background:e.pink?"#FFB7C5":"#4A90E2",opacity:e.opacity}},l))}),(0,t.jsxs)("a",{href:"/","aria-label":"Back to portfolio",className:"absolute top-4 left-4 z-10 inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-150 hover:-translate-y-0.5",style:{background:"rgba(74,144,226,0.15)",border:"1px solid rgba(74,144,226,0.4)",color:"#a8c4e0",backdropFilter:"blur(6px)",textDecoration:"none"},children:[(0,t.jsxs)("svg",{width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.2",strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true",children:[(0,t.jsx)("line",{x1:"19",y1:"12",x2:"5",y2:"12"}),(0,t.jsx)("polyline",{points:"12 19 5 12 12 5"})]}),"Back to portfolio"]}),(0,t.jsxs)("div",{className:"relative max-w-5xl mx-auto px-6 py-16 text-center",children:[(0,t.jsx)("div",{className:"float-anim inline-block mb-6",children:(0,t.jsxs)("svg",{width:"80",height:"80",viewBox:"0 0 80 80",fill:"none",children:[(0,t.jsx)("ellipse",{cx:"40",cy:"42",rx:"30",ry:"26",fill:"#FFB7C5"}),(0,t.jsx)("line",{x1:"40",y1:"18",x2:"40",y2:"62",stroke:"#FF8FAB",strokeWidth:"1.5"}),(0,t.jsx)("path",{d:"M25 32 Q18 28 22 36",stroke:"#FF8FAB",strokeWidth:"1.5",fill:"none",strokeLinecap:"round"}),(0,t.jsx)("path",{d:"M22 42 Q14 40 20 48",stroke:"#FF8FAB",strokeWidth:"1.5",fill:"none",strokeLinecap:"round"}),(0,t.jsx)("path",{d:"M55 32 Q62 28 58 36",stroke:"#FF8FAB",strokeWidth:"1.5",fill:"none",strokeLinecap:"round"}),(0,t.jsx)("path",{d:"M58 42 Q66 40 60 48",stroke:"#FF8FAB",strokeWidth:"1.5",fill:"none",strokeLinecap:"round"}),(0,t.jsx)("circle",{cx:"33",cy:"50",r:"3",fill:"#1a1a2e"}),(0,t.jsx)("circle",{cx:"47",cy:"50",r:"3",fill:"#1a1a2e"}),(0,t.jsx)("circle",{cx:"34",cy:"49",r:"1",fill:"white"}),(0,t.jsx)("circle",{cx:"48",cy:"49",r:"1",fill:"white"}),(0,t.jsx)("path",{d:"M35 56 Q40 61 45 56",stroke:"#1a1a2e",strokeWidth:"1.5",fill:"none",strokeLinecap:"round"}),(0,t.jsx)("path",{d:"M36 18 Q40 8 44 18",stroke:"#4A90E2",strokeWidth:"1.5",fill:"none",strokeLinecap:"round"})]})}),(0,t.jsxs)("h1",{className:"text-4xl sm:text-5xl font-bold text-white mb-3 tracking-tight",children:["Muscle",(0,t.jsx)("span",{style:{color:"#FFB7C5"},children:" → "}),"Machine"]}),(0,t.jsx)("p",{className:"text-lg font-light mb-1",style:{color:"#a8c4e0"},children:"Electromyography-Powered Human-Computer Interaction"}),(0,t.jsx)("p",{className:"text-sm max-w-xl mx-auto mt-3 leading-relaxed",style:{color:"#7a9dbf"},children:"Using an ESP32 to bridge the gap between neuromuscular biopotentials and digital interaction. Open-source. Sub-$35. Built for outreach."}),(0,t.jsx)("div",{className:"flex flex-wrap justify-center gap-2 mt-6",children:["ESP32 Bluetooth","AD8232","Action Potentials","HID Protocol","Open Source"].map(e=>(0,t.jsx)("span",{className:"text-xs px-3 py-1 rounded-full font-medium",style:{background:"rgba(74,144,226,0.18)",color:"#a8c4e0",border:"1px solid rgba(74,144,226,0.3)"},children:e},e))})]})]}),(0,t.jsx)("div",{className:"sticky top-0 z-30",style:{background:"rgba(253,252,240,0.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid #e5e4d8"},children:(0,t.jsx)("div",{className:"max-w-5xl mx-auto px-4",children:(0,t.jsx)("nav",{className:"flex gap-1 overflow-x-auto py-2",style:{scrollbarWidth:"none"},children:p.map(s=>(0,t.jsxs)("button",{onClick:()=>l(s.id),className:"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer",style:{background:e===s.id?"var(--neuro-blue)":"transparent",color:e===s.id?"white":"#666677",boxShadow:e===s.id?"0 2px 10px rgba(74,144,226,0.35)":"none"},children:[(0,t.jsx)("span",{children:s.icon}),s.label]},s.id))})})}),(0,t.jsxs)("main",{className:"max-w-5xl mx-auto px-4 sm:px-6 py-10",children:["game"===e&&(0,t.jsxs)("section",{className:"flex flex-col items-center gap-8",children:[(0,t.jsxs)("div",{className:"text-center max-w-lg",children:[(0,t.jsx)("h2",{className:"text-2xl font-bold mb-2",style:{color:"var(--dark)"},children:"Brain-Bird"}),(0,t.jsxs)("p",{className:"text-sm leading-relaxed",style:{color:"#666677"},children:["A Flappy-Bird clone where your EMG signal is the controller. In this browser demo,"," ",(0,t.jsx)("strong",{children:"Space"})," or a screen tap simulates a muscle contraction. At the outreach booth, a forearm flex triggers the same HID keypress over Bluetooth."]})]}),(0,t.jsx)(n,{}),(0,t.jsxs)("div",{className:"w-full rounded-2xl p-5",style:{background:"#f0f4ff",border:"1.5px solid #c7d8f8",maxWidth:700},children:[(0,t.jsx)("p",{className:"text-xs font-semibold mb-3 uppercase tracking-wider",style:{color:"var(--neuro-blue)"},children:"Signal Pipeline"}),(0,t.jsx)("div",{className:"flex items-center justify-between text-xs text-center",style:{gap:4},children:[{label:"Muscle Flex",icon:"💪",color:"#FFB7C5"},{label:"Electrical Signal",icon:"⚡",color:"#fbbf24"},{label:"Muscle Sensor",icon:"📡",color:"#4A90E2"},{label:"Microcontroller",icon:"🔧",color:"#34d399"},{label:"Wireless (Bluetooth)",icon:"📶",color:"#a78bfa"},{label:"Game Input",icon:"🧠",color:"#FFB7C5"}].map((e,l,s)=>(0,t.jsxs)("div",{className:"flex items-center",style:{gap:4},children:[(0,t.jsxs)("div",{className:"flex flex-col items-center gap-1",children:[(0,t.jsx)("div",{className:"w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0",style:{background:e.color+"30",border:`2px solid ${e.color}`},children:e.icon}),(0,t.jsx)("span",{className:"leading-tight",style:{color:"#444455",maxWidth:72},children:e.label})]}),l<s.length-1&&(0,t.jsx)("svg",{width:"14",height:"10",viewBox:"0 0 16 10",className:"shrink-0 mb-4",children:(0,t.jsx)("path",{d:"M0 5 H12 M8 1 L14 5 L8 9",stroke:"#9999aa",strokeWidth:"1.5",fill:"none",strokeLinecap:"round",strokeLinejoin:"round"})})]},l))})]})]}),"video"===e&&(0,t.jsxs)("section",{className:"flex flex-col items-center gap-8 max-w-2xl mx-auto",children:[(0,t.jsxs)("div",{className:"text-center",children:[(0,t.jsx)("h2",{className:"text-2xl font-bold mb-2",style:{color:"var(--dark)"},children:"Outreach in Action: EMG-Controlled Interface"}),(0,t.jsx)("p",{className:"text-sm leading-relaxed",style:{color:"#666677"},children:"Using an ESP32 to bridge the gap between neuromuscular biopotentials and digital interaction. Recorded live at a STEM outreach event — no script, no cuts."})]}),(0,t.jsxs)("div",{className:"w-full aspect-video rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer group transition-all duration-200",style:{background:"linear-gradient(135deg, #1a1a2e, #0f3460)",border:"2px dashed rgba(74,144,226,0.4)",boxShadow:"0 8px 32px rgba(74,144,226,0.15)"},children:[(0,t.jsx)("div",{className:"w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-150 group-hover:scale-110",style:{background:"rgba(74,144,226,0.2)",border:"2px solid rgba(74,144,226,0.5)"},children:(0,t.jsx)("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"#4A90E2",children:(0,t.jsx)("polygon",{points:"5 3 19 12 5 21 5 3"})})}),(0,t.jsxs)("div",{className:"text-center",children:[(0,t.jsx)("p",{className:"text-white font-semibold",children:"Demo Video — Coming Soon"}),(0,t.jsxs)("p",{className:"text-sm mt-1",style:{color:"#7a9dbf"},children:["Drop a video file here or replace this placeholder with a"," ",(0,t.jsx)("code",{className:"text-xs px-1 rounded",style:{background:"rgba(74,144,226,0.2)",color:"#4A90E2"},children:"<video>"})," ","tag"]})]})]}),(0,t.jsx)("div",{className:"grid grid-cols-3 gap-4 w-full",children:[{label:"Signal Latency",value:"<5 ms",sub:"ADC → Bluetooth packet"},{label:"Detection Accuracy",value:"~94%",sub:"squeeze vs. noise"},{label:"Total BOM Cost",value:"~$35",sub:"ESP32 + sensor + breadboard + cable"}].map(e=>(0,t.jsxs)("div",{className:"rounded-2xl p-4 text-center",style:{background:"white",border:"1.5px solid #e5e4d8",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"},children:[(0,t.jsx)("p",{className:"text-2xl font-bold",style:{color:"var(--neuro-blue)"},children:e.value}),(0,t.jsx)("p",{className:"text-xs font-semibold mt-1",style:{color:"var(--dark)"},children:e.label}),(0,t.jsx)("p",{className:"text-xs mt-0.5",style:{color:"#9999aa"},children:e.sub})]},e.label))})]}),"faq"===e&&(0,t.jsxs)("section",{className:"max-w-2xl mx-auto",children:[(0,t.jsxs)("div",{className:"text-center mb-8",children:[(0,t.jsx)("h2",{className:"text-2xl font-bold mb-2",style:{color:"var(--dark)"},children:"Frequently Asked Questions"}),(0,t.jsx)("p",{className:"text-sm",style:{color:"#666677"},children:"Pre-med, curious visitor, or fellow engineer — these cover the most common questions from outreach events."})]}),(0,t.jsx)(r,{})]}),"build"===e&&(0,t.jsxs)("section",{className:"max-w-3xl mx-auto flex flex-col gap-10",children:[(0,t.jsxs)("div",{className:"text-center",children:[(0,t.jsx)("h2",{className:"text-2xl font-bold mb-2",style:{color:"var(--dark)"},children:"Materials & Build Guide"}),(0,t.jsx)("p",{className:"text-sm",style:{color:"#666677"},children:"Everything you need to replicate this project. Total cost: ~$35. Build time: ~2 hours."})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"text-sm font-semibold uppercase tracking-wider mb-4",style:{color:"var(--neuro-blue)"},children:"Bill of Materials"}),(0,t.jsx)("div",{className:"grid sm:grid-cols-2 gap-3",children:c.map(e=>(0,t.jsxs)("a",{href:e.link,target:"_blank",rel:"noopener noreferrer",className:"group flex items-start gap-4 p-4 rounded-2xl transition-all duration-150 hover:-translate-y-0.5",style:{background:"white",border:"1.5px solid #e5e4d8",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",textDecoration:"none"},children:[(0,t.jsx)("div",{className:"w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg mt-0.5",style:{background:e.color+"20",border:`1.5px solid ${e.color}40`},children:e.name.includes("ESP")?"🔌":e.name.includes("AD")?"📡":e.name.includes("Electrode")?"🩹":"📦"}),(0,t.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,t.jsxs)("div",{className:"flex items-center justify-between gap-2",children:[(0,t.jsx)("p",{className:"font-semibold text-sm",style:{color:"var(--dark)"},children:e.name}),(0,t.jsx)("span",{className:"text-xs font-bold shrink-0",style:{color:e.color},children:e.price})]}),(0,t.jsx)("p",{className:"text-xs mt-0.5 leading-relaxed",style:{color:"#666677"},children:e.desc})]}),(0,t.jsxs)("svg",{className:"shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"#9999aa",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[(0,t.jsx)("path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"}),(0,t.jsx)("polyline",{points:"15 3 21 3 21 9"}),(0,t.jsx)("line",{x1:"10",y1:"14",x2:"21",y2:"3"})]})]},e.name))})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"text-sm font-semibold uppercase tracking-wider mb-4",style:{color:"var(--neuro-blue)"},children:"Wiring (AD8232 → ESP32)"}),(0,t.jsx)("div",{className:"rounded-2xl p-5",style:{background:"#0d1117",border:"1.5px solid #30363d"},children:(0,t.jsxs)("table",{className:"w-full text-sm font-mono",children:[(0,t.jsx)("thead",{children:(0,t.jsxs)("tr",{style:{color:"#8b949e"},children:[(0,t.jsx)("th",{className:"text-left pb-2 font-medium",children:"AD8232 Pin"}),(0,t.jsx)("th",{className:"text-left pb-2 font-medium",children:"ESP32 Pin"}),(0,t.jsx)("th",{className:"text-left pb-2 font-medium",children:"Notes"})]})}),(0,t.jsx)("tbody",{children:[["3.3V","3V3","Power"],["GND","GND","Common ground"],["OUTPUT","GPIO 35","Analog signal (ADC)"],["LO+","GPIO 25","Leads-off detect (optional)"],["LO−","GPIO 26","Leads-off detect (optional)"],["SDN","3V3","Enable chip (tie high)"]].map(([e,l,s],a)=>(0,t.jsxs)("tr",{style:{borderTop:"1px solid #21262d"},children:[(0,t.jsx)("td",{className:"py-2",style:{color:"#ff7b72"},children:e}),(0,t.jsx)("td",{className:"py-2",style:{color:"#79c0ff"},children:l}),(0,t.jsx)("td",{className:"py-2",style:{color:"#8b949e"},children:s})]},a))})]})})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"text-sm font-semibold uppercase tracking-wider mb-4",style:{color:"var(--neuro-blue)"},children:"ESP32 Bluetooth-Keyboard Firmware"}),(0,t.jsx)(i,{code:d,language:"cpp",filename:"emg_hid.ino"})]}),(0,t.jsxs)("div",{className:"rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4",style:{background:"linear-gradient(135deg, #1a1a2e, #0f3460)",boxShadow:"0 4px 24px rgba(74,144,226,0.2)"},children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("p",{className:"font-semibold text-white text-lg",children:"Full Repository on GitHub"}),(0,t.jsx)("p",{className:"text-sm mt-1",style:{color:"#7a9dbf"},children:"Includes schematics, firmware, 3D-print files for the enclosure, and this web demo."})]}),(0,t.jsxs)("a",{href:"https://github.com/UZSaeed/brainbird",target:"_blank",rel:"noopener noreferrer",className:"flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shrink-0 transition-all duration-150 hover:opacity-90 active:scale-95",style:{background:"var(--neuro-blue)",color:"white",textDecoration:"none"},children:[(0,t.jsx)("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"currentColor",children:(0,t.jsx)("path",{d:"M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"})}),"View on GitHub"]})]})]})]}),(0,t.jsxs)("footer",{className:"mt-16 py-8 text-center text-xs",style:{borderTop:"1px solid #e5e4d8",color:"#9999aa"},children:[(0,t.jsx)("p",{children:"Built for STEM outreach · EMG-HCI Demo · Open-source under MIT License"}),(0,t.jsx)("p",{className:"mt-1",children:"AD8232 · ESP32 · Bluetooth HID · HTML5 Canvas · Next.js"})]})]})}],31713)},70553,e=>{e.v(t=>Promise.all(["static/chunks/15o-g-.yo.izp.js"].map(t=>e.l(t))).then(()=>t(58719)))}]);