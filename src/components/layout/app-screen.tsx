import { PropsWithChildren, type RefObject } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollView as ScrollViewType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { DecoratedScreenBackground } from '@/src/components/layout/decorated-screen-background';
import { AuthScreenOverlay } from '@/src/components/layout/auth-screen-overlay';

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  cherryBackground?: boolean;
  softOverlay?: boolean;
  backgroundless?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollRef?: RefObject<ScrollViewType | null>;
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive';
  edges?: Edge[];
}>;

export function AppScreen({
  children,
  scroll = false,
  keyboardAvoiding = true,
  gradientColors,
  cherryBackground = false,
  softOverlay = false,
  backgroundless = false,
  style,
  contentContainerStyle,
  scrollRef,
  keyboardDismissMode,
  edges = ['top', 'bottom'],
}: AppScreenProps) {
  const resolvedKeyboardDismissMode =
    keyboardDismissMode ?? (scroll ? (Platform.OS === 'ios' ? 'interactive' : 'none') : 'none');

  const content = scroll ? (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={resolvedKeyboardDismissMode}
      onScrollBeginDrag={Keyboard.dismiss}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, contentContainerStyle]}>{children}</View>
  );

  const inner = (
    <View style={styles.flex}>
      {softOverlay ? <AuthScreenOverlay /> : null}
      {content}
    </View>
  );

  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    <View style={[styles.root, style]}>
      {!backgroundless ? <DecoratedScreenBackground showCherry={cherryBackground} /> : null}
      <SafeAreaView style={styles.safeArea} edges={edges}>
        {body}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
