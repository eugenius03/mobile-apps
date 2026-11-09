import React, { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import BevelButton from './BevelButton';
import { ShadowCard } from './Cards';
import { useDialog } from './dialogs';
import { colors } from '../styles/theme';

export default function DialogHost() {
  const dialog = useDialog();

  useEffect(() => {
    if (!dialog) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      dialog.close(false);
      return true;
    });
    return () => sub.remove();
  }, [dialog]);

  if (!dialog) return null;
  return (
    <Pressable style={styles.scrim} onPress={() => dialog.close(false)}>
      <Pressable style={styles.card}>
        <ShadowCard>
          <View style={styles.body}>
            <Text style={styles.title}>{dialog.title}</Text>
            <Text style={styles.message}>{dialog.message}</Text>
            <View style={styles.buttons}>
              <BevelButton
                text="Скасувати"
                base={colors.neutral}
                textColor={colors.border}
                onPress={() => dialog.close(false)}
                style={styles.button}
              />
              <BevelButton
                text={dialog.confirmText}
                base={colors.off}
                textColor={colors.border}
                onPress={() => dialog.close(true)}
                style={styles.button}
              />
            </View>
          </View>
        </ShadowCard>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim, justifyContent: 'center', padding: 24 },
  card: { width: '100%' },
  body: { gap: 14 },
  title: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  message: { color: colors.ink, fontSize: 16 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  button: { flex: 1 },
});
