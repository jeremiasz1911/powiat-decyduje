import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ProfileDetailRowProps = {
  icon: IoniconName;
  label: string;
  value: string;
  badge?: ReactNode;
};

export function ProfileDetailRow({ icon, label, value, badge }: ProfileDetailRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={appColors.primary} />
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value} numberOfLines={3}>
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
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={styles.hero}>
      <View style={[styles.avatarRing, verified ? styles.avatarRingVerified : null]}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials || '?'}</Text>
        </View>
        {verified ? (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={12} color={appColors.textOnPrimary} />
          </View>
        ) : null}
      </View>

      <View style={styles.heroBody}>
        <Text style={styles.heroName} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.heroSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
        <View style={[styles.statusBadge, verified ? styles.statusBadgeVerified : null]}>
          <Ionicons
            name={verified ? 'shield-checkmark-outline' : 'time-outline'}
            size={14}
            color={verified ? appColors.primary : appColors.textMuted}
          />
          <Text style={[styles.statusBadgeText, verified ? styles.statusBadgeTextVerified : null]}>
            {statusLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function ProfileVerificationBadge({ verified }: { verified: boolean }) {
  return (
    <View style={[styles.verificationTag, verified ? styles.verificationTagOk : styles.verificationTagPending]}>
      <Text style={[styles.verificationTagText, verified ? styles.verificationTagTextOk : null]}>
        {verified ? 'Zweryfikowany' : 'Niezweryfikowany'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    paddingHorizontal: appTheme.spacing.md,
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
    backgroundColor: appColors.primarySoft,
    marginTop: 2,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: appColors.textMuted,
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
    color: appColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.lg,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.lg,
  },
  avatarRing: {
    position: 'relative',
    padding: 3,
    borderRadius: 24,
    backgroundColor: appColors.surfaceSoft,
  },
  avatarRingVerified: {
    backgroundColor: appColors.primarySoft,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    ...appShadows.soft,
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
    backgroundColor: appColors.primary,
    borderWidth: 2,
    borderColor: appColors.surface,
  },
  initials: {
    color: appColors.primary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroBody: {
    flex: 1,
    gap: 5,
  },
  heroName: {
    color: appColors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroSubtitle: {
    color: appColors.textMuted,
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
    backgroundColor: appColors.surfaceSoft,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  statusBadgeVerified: {
    backgroundColor: appColors.primarySoft,
    borderColor: 'rgba(227, 6, 19, 0.18)',
  },
  statusBadgeText: {
    color: appColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadgeTextVerified: {
    color: appColors.primary,
  },
  verificationTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verificationTagOk: {
    backgroundColor: appColors.primarySoft,
  },
  verificationTagPending: {
    backgroundColor: appColors.surfaceSoft,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  verificationTagText: {
    color: appColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  verificationTagTextOk: {
    color: appColors.primary,
  },
});
