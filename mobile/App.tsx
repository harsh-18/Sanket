import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  CommunicationPreferences,
  ConversationMessage,
  ISL_SIGNS,
  SANKET_COLORS,
  SUPPORTED_LANGUAGES,
} from '@sanket/shared';
import { IslVisualizer } from './src/IslVisualizer';

type Screen = 'onboarding' | 'home' | 'nearby' | 'conversation' | 'accessibility' | 'calls';

const DEFAULT_PREFS: CommunicationPreferences = {
  name: 'Guest',
  spokenLanguage: 'hi-IN',
  writtenLanguage: 'hi-IN',
  signLanguage: 'ISL',
  sendMethods: ['speech', 'text'],
  receiveMethods: ['isl', 'text', 'audio'],
  fontScale: 1,
  speechRate: 1,
  highContrast: false,
  haptics: true,
  captionsEnabled: true,
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [prefs, setPrefs] = useState<CommunicationPreferences>(DEFAULT_PREFS);
  const [roomCode, setRoomCode] = useState('SANKET-42');
  const [inputCode, setInputCode] = useState('');
  const [pendingAccept, setPendingAccept] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [draft, setDraft] = useState('');
  const [composerTab, setComposerTab] = useState<'speak' | 'sign' | 'type'>('sign');
  const [serverUrl, setServerUrl] = useState('http://localhost:8080');
  const [messages, setMessages] = useState<ConversationMessage[]>([
    {
      id: 'm1',
      fromId: 'partner',
      fromName: 'Asha',
      language: 'hi-IN',
      text: 'नमस्ते, मुझे डॉक्टर के पास जाना है',
      modality: 'speech',
      confidence: 0.94,
      timestamp: Date.now() - 60000,
    },
  ]);

  const [permission, requestPermission] = useCameraPermissions();
  const wsRef = useRef<WebSocket | null>(null);

  // Android hardware back button handling
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen !== 'home') {
        setScreen('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen]);

  const triggerHaptic = () => {
    if (prefs.haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const connectWebSocket = (code: string) => {
    try {
      wsRef.current?.close();
      const wsBase = serverUrl.replace(/^http/, 'ws');
      const ws = new WebSocket(`${wsBase}/ws/${encodeURIComponent(code)}`);
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data?.type === 'msg' && data.msg) {
            setMessages((prev) => [...prev, data.msg]);
            if (prefs.receiveMethods.includes('audio')) {
              Speech.speak(data.msg.text, { language: prefs.spokenLanguage, rate: prefs.speechRate });
            }
            triggerHaptic();
          }
        } catch {}
      };
      wsRef.current = ws;
    } catch {}
  };

  const sendMessage = (text: string, modality: ConversationMessage['modality'], gloss?: string) => {
    if (!text.trim() || paused) return;
    const msg: ConversationMessage = {
      id: `m-${Date.now()}`,
      fromId: 'me',
      fromName: prefs.name || 'Guest',
      language: prefs.spokenLanguage,
      text: text.trim(),
      modality,
      gloss,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'msg', room: roomCode, msg }));
    }
    triggerHaptic();
  };

  const toggleSend = (m: CommunicationPreferences['sendMethods'][number]) => {
    setPrefs((p) => ({
      ...p,
      sendMethods: p.sendMethods.includes(m) ? p.sendMethods.filter((x) => x !== m) : [...p.sendMethods, m],
    }));
  };

  const toggleReceive = (m: CommunicationPreferences['receiveMethods'][number]) => {
    setPrefs((p) => ({
      ...p,
      receiveMethods: p.receiveMethods.includes(m) ? p.receiveMethods.filter((x) => x !== m) : [...p.receiveMethods, m],
    }));
  };

  const fs = (base: number) => base * prefs.fontScale;
  const bg = prefs.highContrast ? '#FFFFFF' : SANKET_COLORS.bg;
  const txt = prefs.highContrast ? '#0B0D18' : SANKET_COLORS.text;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />

        {/* Platform-Aware Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => setScreen('home')}
            accessibilityRole="button"
            accessibilityLabel="Sanket Home"
            style={styles.brandRow}
          >
            <View style={styles.brandIcon}>
              <Text style={{ fontSize: 18 }}>🤟</Text>
            </View>
            <View>
              <Text style={[styles.brandTitle, { color: txt }]}>Sanket</Text>
              <Text style={styles.platformBadge}>
                {Platform.OS === 'ios' ? 'iPhone · iOS' : 'Android · Material 3'}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setScreen('accessibility')}
            accessibilityRole="button"
            accessibilityLabel="Open Accessibility and Preferences"
            style={styles.headerBtn}
          >
            <Text style={styles.headerBtnText}>🎛️ Prefs</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {screen === 'home' && (
            <View style={{ gap: 14 }}>
              <Text style={[styles.h1, { fontSize: fs(24), color: txt }]}>Hello, {prefs.name || 'Guest'} 👋</Text>
              <Text style={[styles.sub, { fontSize: fs(14) }]}>
                Two devices. Different preferences. One shared conversation.
              </Text>

              <Pressable
                onPress={() => setScreen('nearby')}
                android_ripple={{ color: '#D8D2FA' }}
                accessibilityRole="button"
                style={[styles.heroTile, { backgroundColor: SANKET_COLORS.lavender }]}
              >
                <Text style={styles.tileIcon}>📲</Text>
                <Text style={[styles.tileTitle, { fontSize: fs(18), color: txt }]}>Connect Nearby (MVP)</Text>
                <Text style={[styles.tileSub, { fontSize: fs(13) }]}>
                  Pair with someone nearby via QR code or pairing code
                </Text>
              </Pressable>

              <View style={styles.row2}>
                <Pressable
                  onPress={() => {
                    connectWebSocket(roomCode);
                    setScreen('conversation');
                  }}
                  android_ripple={{ color: '#D1E2FF' }}
                  accessibilityRole="button"
                  style={[styles.heroTile, { flex: 1, backgroundColor: SANKET_COLORS.blue }]}
                >
                  <Text style={styles.tileIcon}>💬</Text>
                  <Text style={[styles.tileTitle, { fontSize: fs(16), color: txt }]}>Live Chat</Text>
                  <Text style={[styles.tileSub, { fontSize: fs(12) }]}>Speech ⇄ ISL studio</Text>
                </Pressable>

                <Pressable
                  onPress={() => setScreen('calls')}
                  android_ripple={{ color: '#C4EDE0' }}
                  accessibilityRole="button"
                  style={[styles.heroTile, { flex: 1, backgroundColor: SANKET_COLORS.mint }]}
                >
                  <Text style={styles.tileIcon}>📹</Text>
                  <Text style={[styles.tileTitle, { fontSize: fs(16), color: txt }]}>Sanket Calls</Text>
                  <Text style={[styles.tileSub, { fontSize: fs(12) }]}>Remote (Future)</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => setScreen('onboarding')}
                style={styles.card}
                accessibilityRole="button"
              >
                <Text style={[styles.tileTitle, { fontSize: fs(15), color: txt }]}>
                  Communication Preferences
                </Text>
                <Text style={[styles.tileSub, { fontSize: fs(13) }]}>
                  Send: {prefs.sendMethods.join(', ')} · Receive: {prefs.receiveMethods.join(', ')}
                </Text>
              </Pressable>
            </View>
          )}

          {screen === 'onboarding' && (
            <View style={{ gap: 14 }}>
              <Text style={[styles.h1, { fontSize: fs(22), color: txt }]}>How do you prefer to communicate?</Text>
              <View style={styles.card}>
                <Text style={[styles.label, { fontSize: fs(14), color: txt }]}>I prefer to send messages using:</Text>
                <View style={styles.chipWrap}>
                  {(['speech', 'sign', 'text', 'board'] as const).map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => toggleSend(m)}
                      style={[styles.selChip, prefs.sendMethods.includes(m) && styles.selChipOn]}
                    >
                      <Text style={[styles.selChipText, prefs.sendMethods.includes(m) && { color: '#fff' }]}>
                        {m.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.label, { fontSize: fs(14), color: txt, marginTop: 14 }]}>
                  I prefer to receive messages as:
                </Text>
                <View style={styles.chipWrap}>
                  {(['isl', 'text', 'audio', 'haptic'] as const).map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => toggleReceive(m)}
                      style={[styles.selChip, prefs.receiveMethods.includes(m) && styles.selChipOn]}
                    >
                      <Text style={[styles.selChipText, prefs.receiveMethods.includes(m) && { color: '#fff' }]}>
                        {m.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable onPress={() => setScreen('home')} style={[styles.primaryBtn, { marginTop: 16 }]}>
                  <Text style={styles.primaryBtnText}>Save &amp; Continue</Text>
                </Pressable>
              </View>
            </View>
          )}

          {screen === 'nearby' && (
            <View style={{ gap: 14 }}>
              <Text style={[styles.h1, { fontSize: fs(22), color: txt }]}>Connect Nearby</Text>
              <View style={styles.card}>
                <Text style={[styles.label, { color: txt }]}>Your Temporary Pairing Code</Text>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{roomCode}</Text>
                </View>
                <Pressable
                  onPress={() => setRoomCode(`SANKET-${Math.floor(10 + Math.random() * 89)}`)}
                  style={[styles.secondaryBtn, { marginTop: 10 }]}
                >
                  <Text style={styles.secondaryBtnText}>Generate New Code</Text>
                </Pressable>
              </View>

              <View style={styles.card}>
                <Text style={[styles.label, { color: txt }]}>Scan Partner QR or Enter Code</Text>
                {scanning && permission?.granted ? (
                  <View style={styles.cameraBox}>
                    <CameraView
                      style={{ flex: 1 }}
                      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      onBarcodeScanned={({ data }) => {
                        setScanning(false);
                        setInputCode(data);
                        setPendingAccept(true);
                      }}
                    />
                  </View>
                ) : (
                  <Pressable
                    onPress={async () => {
                      const res = await requestPermission();
                      if (res.granted) setScanning(true);
                    }}
                    style={[styles.primaryBtn, { marginTop: 8 }]}
                  >
                    <Text style={styles.primaryBtnText}>📷 Scan Partner QR Code</Text>
                  </Pressable>
                )}

                <TextInput
                  value={inputCode}
                  onChangeText={setInputCode}
                  placeholder="Enter pairing code (e.g. SANKET-42)"
                  autoCapitalize="characters"
                  style={styles.input}
                />
                <Pressable
                  onPress={() => {
                    if (inputCode.trim()) setPendingAccept(true);
                  }}
                  style={[styles.secondaryBtn, { marginTop: 8 }]}
                >
                  <Text style={styles.secondaryBtnText}>Request Connection</Text>
                </Pressable>

                {pendingAccept && (
                  <View style={[styles.card, { backgroundColor: SANKET_COLORS.amber, marginTop: 12 }]}>
                    <Text style={{ fontWeight: '700', color: SANKET_COLORS.amberText }}>
                      Accept connection to {inputCode || roomCode}?
                    </Text>
                    <View style={[styles.row2, { marginTop: 8 }]}>
                      <Pressable
                        onPress={() => {
                          const target = (inputCode || roomCode).trim().toUpperCase();
                          setRoomCode(target);
                          setPendingAccept(false);
                          connectWebSocket(target);
                          setScreen('conversation');
                        }}
                        style={[styles.primaryBtn, { flex: 1 }]}
                      >
                        <Text style={styles.primaryBtnText}>✓ Accept</Text>
                      </Pressable>
                      <Pressable onPress={() => setPendingAccept(false)} style={[styles.secondaryBtn, { flex: 1 }]}>
                        <Text style={styles.secondaryBtnText}>Decline</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {screen === 'conversation' && (
            <View style={{ gap: 12 }}>
              <View style={[styles.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View>
                  <Text style={{ fontWeight: '800', color: txt }}>Room: {roomCode}</Text>
                  <Text style={{ fontSize: 12, color: SANKET_COLORS.textSecondary }}>
                    {paused ? '⏸ Paused' : '● Connected Nearby'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => setPaused((p) => !p)} style={styles.secondaryBtn}>
                    <Text style={styles.secondaryBtnText}>{paused ? '▶ Resume' : '⏸ Pause'}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      wsRef.current?.close();
                      setScreen('home');
                    }}
                    style={[styles.secondaryBtn, { backgroundColor: SANKET_COLORS.dangerBg }]}
                  >
                    <Text style={{ color: SANKET_COLORS.danger, fontWeight: '700' }}>End</Text>
                  </Pressable>
                </View>
              </View>

              {/* Partner ISL Visualiser Spotlight */}
              {messages.length > 0 && (
                <View style={styles.card}>
                  <Text style={[styles.label, { color: txt }]}>Partner Output · ISL Visualisation</Text>
                  <Text style={{ fontSize: fs(15), fontWeight: '700', color: txt, marginTop: 4 }}>
                    {messages[messages.length - 1].text}
                  </Text>
                  <IslVisualizer text={messages[messages.length - 1].text} fontScale={prefs.fontScale} />
                </View>
              )}

              {/* Composer */}
              <View style={styles.card}>
                <View style={styles.row2}>
                  {(['sign', 'type', 'speak'] as const).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setComposerTab(t)}
                      style={[styles.selChip, composerTab === t && styles.selChipOn, { flex: 1, alignItems: 'center' }]}
                    >
                      <Text style={[styles.selChipText, composerTab === t && { color: '#fff' }]}>
                        {t === 'sign' ? '🤟 ISL' : t === 'type' ? '⌨️ Type' : '🎙️ Speak'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {composerTab === 'sign' && (
                  <View style={[styles.chipWrap, { marginTop: 10 }]}>
                    {Object.entries(ISL_SIGNS).slice(0, 8).map(([gloss, def]) => (
                      <Pressable
                        key={gloss}
                        onPress={() => sendMessage(prefs.spokenLanguage === 'hi-IN' ? def.hi : gloss, 'sign-card', gloss)}
                        style={styles.glossBtn}
                      >
                        <Text style={{ fontWeight: '700', color: txt }}>{def.icon} {def.hi}</Text>
                        <Text style={{ fontSize: 11, color: SANKET_COLORS.textSecondary }}>{gloss}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {composerTab === 'type' && (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    <TextInput
                      value={draft}
                      onChangeText={setDraft}
                      placeholder="Type message in any language…"
                      style={styles.input}
                    />
                    <Pressable
                      onPress={() => {
                        sendMessage(draft, 'text');
                        setDraft('');
                      }}
                      style={styles.primaryBtn}
                    >
                      <Text style={styles.primaryBtnText}>Send Message</Text>
                    </Pressable>
                  </View>
                )}

                {composerTab === 'speak' && (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    <Text style={{ color: SANKET_COLORS.textSecondary, fontSize: 13 }}>
                      Device speech-to-text uses platform speech services or BHASHINI backend when configured. Tap any phrase or type if offline:
                    </Text>
                    <Pressable
                      onPress={() => Speech.speak(messages[messages.length - 1]?.text || 'Namaste', { language: prefs.spokenLanguage, rate: prefs.speechRate })}
                      style={styles.primaryBtn}
                    >
                      <Text style={styles.primaryBtnText}>🔊 Speak Latest Message Aloud</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          )}

          {screen === 'accessibility' && (
            <View style={{ gap: 14 }}>
              <Text style={[styles.h1, { fontSize: fs(22), color: txt }]}>Accessibility &amp; Settings</Text>
              <View style={styles.card}>
                <View style={styles.settingRow}>
                  <Text style={[styles.label, { color: txt }]}>High-Contrast Mode</Text>
                  <Switch value={prefs.highContrast} onValueChange={(v) => setPrefs((p) => ({ ...p, highContrast: v }))} />
                </View>
                <View style={styles.settingRow}>
                  <Text style={[styles.label, { color: txt }]}>Haptic Alerts</Text>
                  <Switch value={prefs.haptics} onValueChange={(v) => setPrefs((p) => ({ ...p, haptics: v }))} />
                </View>
                <Text style={[styles.label, { color: txt, marginTop: 10 }]}>Active Language</Text>
                <View style={[styles.chipWrap, { marginTop: 6 }]}>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <Pressable
                      key={l.code}
                      onPress={() => setPrefs((p) => ({ ...p, spokenLanguage: l.code }))}
                      style={[styles.selChip, prefs.spokenLanguage === l.code && styles.selChipOn]}
                    >
                      <Text style={[styles.selChipText, prefs.spokenLanguage === l.code && { color: '#fff' }]}>{l.short}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.label, { color: txt, marginTop: 14 }]}>Nearby Backend URL (Optional)</Text>
                <TextInput value={serverUrl} onChangeText={setServerUrl} style={styles.input} />
              </View>
            </View>
          )}

          {screen === 'calls' && (
            <View style={styles.card}>
              <Text style={[styles.h1, { fontSize: fs(20), color: txt }]}>Sanket Calls (Roadmap)</Text>
              <Text style={{ color: SANKET_COLORS.textSecondary, marginTop: 6 }}>
                Remote WebRTC calling with live Speech ⇄ ISL translation is planned as Priority 2 after Sanket Nearby.
              </Text>
              <Pressable onPress={() => setScreen('nearby')} style={[styles.primaryBtn, { marginTop: 14 }]}>
                <Text style={styles.primaryBtnText}>Go to Connect Nearby</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Bottom Tab Bar (Material 3 / iOS Tab Bar) */}
        <View style={styles.bottomBar}>
          {(
            [
              { id: 'home', label: 'Home', icon: '🏠' },
              { id: 'nearby', label: 'Nearby', icon: '📲' },
              { id: 'conversation', label: 'Chat', icon: '💬' },
              { id: 'accessibility', label: 'Access', icon: '🎛️' },
            ] as const
          ).map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setScreen(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: screen === tab.id }}
              style={[styles.tabBtn, screen === tab.id && styles.tabBtnActive]}
            >
              <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, screen === tab.id && { color: SANKET_COLORS.primary }]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: SANKET_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: SANKET_COLORS.border,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: SANKET_COLORS.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: { fontSize: 18, fontWeight: '800' },
  platformBadge: { fontSize: 11, color: SANKET_COLORS.textSecondary, fontWeight: '600' },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: SANKET_COLORS.bg,
    borderWidth: 1,
    borderColor: SANKET_COLORS.border,
  },
  headerBtnText: { fontWeight: '700', fontSize: 13, color: SANKET_COLORS.text },
  scroll: { padding: 16, paddingBottom: 32 },
  h1: { fontWeight: '800' },
  sub: { color: SANKET_COLORS.textSecondary },
  heroTile: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SANKET_COLORS.border,
    gap: 4,
  },
  tileIcon: { fontSize: 24, marginBottom: 4 },
  tileTitle: { fontWeight: '800' },
  tileSub: { color: SANKET_COLORS.textSecondary },
  row2: { flexDirection: 'row', gap: 10 },
  card: {
    backgroundColor: SANKET_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: SANKET_COLORS.border,
  },
  label: { fontWeight: '700', fontSize: 14 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  selChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SANKET_COLORS.border,
    backgroundColor: SANKET_COLORS.bg,
  },
  selChipOn: { backgroundColor: SANKET_COLORS.primary, borderColor: SANKET_COLORS.primary },
  selChipText: { fontWeight: '700', fontSize: 12, color: SANKET_COLORS.text },
  primaryBtn: {
    backgroundColor: SANKET_COLORS.primary,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryBtn: {
    backgroundColor: SANKET_COLORS.bg,
    borderWidth: 1,
    borderColor: SANKET_COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: SANKET_COLORS.text, fontWeight: '700', fontSize: 13 },
  codeBox: {
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: SANKET_COLORS.lavender,
    alignItems: 'center',
  },
  codeText: { fontSize: 22, fontWeight: '800', letterSpacing: 3, color: SANKET_COLORS.primary },
  cameraBox: { height: 220, borderRadius: 14, overflow: 'hidden', marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: SANKET_COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: SANKET_COLORS.surface,
    marginTop: 8,
    fontSize: 15,
  },
  glossBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SANKET_COLORS.border,
    backgroundColor: SANKET_COLORS.bg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: SANKET_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: SANKET_COLORS.border,
  },
  tabBtn: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  tabBtnActive: { backgroundColor: SANKET_COLORS.lavender },
  tabLabel: { fontSize: 11, fontWeight: '700', color: SANKET_COLORS.textSecondary, marginTop: 2 },
});
