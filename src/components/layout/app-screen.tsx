import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
}>;

export function AppScreen({
  children,
  scroll = false,
  keyboardAvoiding = true,
  gradientColors,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
}: AppScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, contentContainerStyle]}>{children}</View>
  );

  const background = gradientColors ? (
    <LinearGradient colors={gradientColors} style={styles.flex}>
      {content}
    </LinearGradient>
  ) : (
    <View style={styles.flex}>{content}</View>
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
    <SafeAreaView style={[styles.safeArea, style]} edges={edges}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#03182f',
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
