import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ProfileDetailRowProps = {
  icon: IoniconName;
  label: string;
  value: string;
  badge?: ReactNode;
};

export function ProfileDetailRow({ icon, label, value, badge }: ProfileDetailRowProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={3}>
            {value}
          </Text>
          {badge}
        </View>
      </View>
    </View>
  );
}

type ProfileHeroProps = {
  name: string;
  subtitle: string;
  statusLabel: string;
  verified: boolean;
};

export function ProfileHero({ name, subtitle, statusLabel, verified }: ProfileHeroProps) {
  const { colors } = useAppTheme();
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={styles.hero}>
      <View
        style={[
          styles.avatarRing,
          { backgroundColor: verified ? colors.primarySoft : colors.surfaceSoft },
        ]}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.surfaceSoft,
              borderColor: colors.border,
            },
          ]}>
          <Text style={[styles.initials, { color: colors.primary }]}>{initials || '?'}</Text>
        </View>
        {verified ? (
          <View
            style={[
              styles.verifiedBadge,
              { backgroundColor: colors.primary, borderColor: colors.surface },
            ]}>
            <Ionicons name="checkmark" size={12} color={colors.textOnPrimary} />
          </View>
        ) : null}
      </View>

      <View style={styles.heroBody}>
        <Text style={[styles.heroName, { color: colors.textPrimary }]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
          {subtitle}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: verified ? colors.primarySoft : colors.surfaceSoft,
              borderColor: verified ? colors.borderStrong : colors.border,
            },
          ]}>
          <Ionicons
            name={verified ? 'shield-checkmark-outline' : 'time-outline'}
            size={14}
            color={verified ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.statusBadgeText,
              { color: verified ? colors.primary : colors.textSecondary },
            ]}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function ProfileVerificationBadge({ verified }: { verified: boolean }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.verificationTag,
        verified
          ? { backgroundColor: colors.primarySoft }
          : { backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
      ]}>
      <Text
        style={[
          styles.verificationTagText,
          { color: verified ? colors.primary : colors.textMuted },
        ]}>
        {verified ? 'Zweryfikowany' : 'Niezweryfikowany'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  value: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.sm,
  },
  avatarRing: {
    position: 'relative',
    padding: 3,
    borderRadius: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  initials: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroBody: {
    flex: 1,
    gap: 5,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  verificationTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verificationTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
