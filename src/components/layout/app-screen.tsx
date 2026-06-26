import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { CherryBackground } from '@/src/components/layout/CherryBackground';
import { AuthScreenOverlay } from '@/src/components/layout/auth-screen-overlay';
import { appGradients, appTheme } from '@/src/theme/app-theme';

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  cherryBackground?: boolean;
  softOverlay?: boolean;
  backgroundless?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
}>;

export function AppScreen({
  children,
  scroll = false,
  keyboardAvoiding = true,
  gradientColors = appGradients.screen,
  cherryBackground = false,
  softOverlay = false,
  backgroundless = false,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
}: AppScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, contentContainerStyle]}>{children}</View>
  );

  const background = backgroundless ? (
    <View style={styles.flex}>{content}</View>
  ) : (
    <View style={styles.flex}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
      {cherryBackground ? <CherryBackground /> : null}
      {softOverlay ? <AuthScreenOverlay /> : null}
      {content}
    </View>
  );

  const body = keyboardAvoiding ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}>
      {background}
    </KeyboardAvoidingView>
  ) : (
    background
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, backgroundless ? styles.safeAreaTransparent : null, style]}
      edges={edges}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  safeAreaTransparent: {
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
