import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { type ResidentAccount } from '@/src/services';
import { appColors, appShadows, appTheme } from '@/src/theme/app-theme';

const PROFILE_ICONS = ['person-outline', 'people-outline', 'home-outline', 'id-card-outline'] as const;

type ResidentAccountPickerCardProps = {
  account: ResidentAccount;
  index: number;
  selected: boolean;
  selecting: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function maskPesel(pesel: string): string {
  if (pesel.length < 4) {
    return pesel;
  }

  return `•••••••${pesel.slice(-4)}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) {
    return phone;
  }

  return `tel. ••• ${digits.slice(-4)}`;
}

function buildDescription(account: ResidentAccount): string {
  const commune = account.commune?.trim() || account.address?.commune?.trim() || 'Powiat mlawski';
  return `Mieszkaniec gminy ${commune}`;
}

export function ResidentAccountPickerCard({
  account,
  index,
  selected,
  selecting,
  disabled = false,
  onPress,
}: ResidentAccountPickerCardProps) {
  const displayName = account.label?.trim() || account.fullName?.trim() || `Profil ${index + 1}`;
  const iconName = PROFILE_ICONS[index % PROFILE_ICONS.length];
  const isDisabled = disabled || selecting;
  const verified = account.phoneVerified;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: isDisabled }}
      accessibilityLabel={`Wybierz profil ${displayName}`}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : null,
        pressed && !isDisabled ? styles.cardPressed : null,
        isDisabled && !selecting ? styles.cardDisabled : null,
      ]}>
      <View style={[styles.avatarRing, selected ? styles.avatarRingSelected : null]}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{getInitials(displayName)}</Text>
        </View>
        <View style={styles.avatarIconBadge}>
          <Ionicons name={iconName} size={11} color={appColors.primary} />
        </View>
        {verified ? (
          <View style={styles.verifiedDot}>
            <Ionicons name="checkmark" size={10} color={appColors.textOnPrimary} />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, selected ? styles.titleSelected : null]} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {buildDescription(account)}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          PESEL {maskPesel(account.pesel)}
          {account.phoneNumber ? ` · ${maskPhone(account.phoneNumber)}` : ''}
        </Text>
      </View>

      <View style={styles.trailing}>
        {selecting ? (
          <ActivityIndicator size="small" color={appColors.primary} />
        ) : selected ? (
          <View style={styles.selectedMark}>
            <Ionicons name="checkmark-circle" size={22} color={appColors.primary} />
          </View>
        ) : (
          <View style={styles.unselectedMark}>
            <View style={styles.radioOuter} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 16,
    backgroundColor: appColors.surface,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 14,
    ...appShadows.soft,
  },
  cardSelected: {
    borderColor: appColors.primary,
    borderWidth: 2,
    backgroundColor: appColors.primarySoft,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  avatarRing: {
    position: 'relative',
    padding: 2,
    borderRadius: 18,
    backgroundColor: appColors.surfaceSoft,
  },
  avatarRingSelected: {
    backgroundColor: 'rgba(227, 6, 19, 0.14)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  initials: {
    color: appColors.primary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  avatarIconBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  verifiedDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primary,
    borderWidth: 2,
    borderColor: appColors.surface,
  },
  body: {
    flex: 1,
    gap: 3,
    paddingRight: appTheme.spacing.xs,
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  titleSelected: {
    color: appColors.primary,
  },
  description: {
    color: appColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    color: appColors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  trailing: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedMark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
  },
});
