import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SANKET_COLORS, textToIslSequence } from '@sanket/shared';

interface Props {
  text: string;
  fontScale?: number;
}

export function IslVisualizer({ text, fontScale = 1 }: Props) {
  const seq = textToIslSequence(text);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
    if (seq.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1 < seq.length ? prev + 1 : 0));
    }, 1350);
    return () => clearInterval(timer);
  }, [text]);

  const active = seq[idx] || seq[0];

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`ISL sign sequence for ${text}`}>
      <View style={styles.stage}>
        <View style={styles.glyphBox}>
          <Text style={styles.emoji}>{active.icon}</Text>
          <View style={styles.dirBadge}>
            <Text style={styles.dirText}>{active.dir}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { fontSize: 16 * fontScale }]}>
            {active.gloss} · {active.hi}
          </Text>
          <Text style={[styles.desc, { fontSize: 13 * fontScale }]}>{active.desc}</Text>
        </View>
      </View>

      <View style={styles.strip}>
        {seq.map((item, i) => (
          <Pressable
            key={`${item.gloss}-${i}`}
            onPress={() => setIdx(i)}
            accessibilityRole="button"
            accessibilityLabel={`Show sign ${item.gloss}`}
            style={[styles.pill, i === idx && styles.pillActive]}
          >
            <Text style={[styles.pillText, i === idx && styles.pillTextActive]}>
              {item.icon} {item.gloss}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.attr}>ISL Sign Cards · ISLRTC / AI4Bharat INCLUDE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: SANKET_COLORS.bg,
    borderWidth: 1,
    borderColor: '#D8D2FA',
    gap: 10,
  },
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: SANKET_COLORS.surface,
    borderWidth: 1,
    borderColor: SANKET_COLORS.border,
  },
  glyphBox: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: SANKET_COLORS.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emoji: { fontSize: 30 },
  dirBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: SANKET_COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  dirText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  title: { fontWeight: '800', color: SANKET_COLORS.text },
  desc: { color: SANKET_COLORS.textSecondary, marginTop: 2 },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: SANKET_COLORS.surface,
    borderWidth: 1,
    borderColor: SANKET_COLORS.border,
  },
  pillActive: { backgroundColor: SANKET_COLORS.primary, borderColor: SANKET_COLORS.primary },
  pillText: { fontSize: 11, fontWeight: '700', color: SANKET_COLORS.textSecondary },
  pillTextActive: { color: '#fff' },
  attr: { fontSize: 10, color: SANKET_COLORS.textSecondary },
});
