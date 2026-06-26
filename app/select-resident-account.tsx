import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/src/components/screen-container';
import { SettingsCard, SettingsGroup, SettingsRow } from '@/src/components/settings/settings-ui';
import { ResidentAccountPickerCard } from '@/src/features/auth/components/resident-account-picker-card';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { useAuthContext } from '@/src/store/auth-context';
import { appColors, appTheme } from '@/src/theme/app-theme';

export default function SelectResidentAccountScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { residentAccounts, activeResidentAccountId, setActiveResidentAccountId, refreshResidentAccounts } =
    useAuthContext();
  const [isWorking, setIsWorking] = useState(false);
  const [selectingAccountId, setSelectingAccountId] = useState<string | null>(null);

  const activeAccount = useMemo(
    () => residentAccounts.find((account) => account.id === activeResidentAccountId) ?? null,
    [activeResidentAccountId, residentAccounts]
  );

  const handleSelect = async (accountId: string) => {
    setIsWorking(true);
    setSelectingAccountId(accountId);

    try {
      const accounts = await refreshResidentAccounts();
      await setActiveResidentAccountId(accountId, accounts);

      await notify('Konto wybrane', 'Wybrany profil mieszkanca jest aktywny.', 'success');
      router.replace('/(drawer)/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udalo sie przelaczyc konta.';
      await notify('Blad wyboru konta', message, 'error');
    } finally {
      setIsWorking(false);
      setSelectingAccountId(null);
    }
  };

  return (
    <ScreenContainer
      title="Profil mieszkańca"
      description="Wybierz konto, z ktorego chcesz korzystac w aplikacji.">
      <View style={styles.sections}>
        <SettingsCard style={styles.heroCard}>
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="people-outline" size={26} color={appColors.primary} />
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.heroTitle}>Wybierz profil</Text>
              <Text style={styles.heroText}>
                Ten numer telefonu ma kilka profili. Dotknij karty, aby aktywowac wybrane konto
                mieszkanca.
              </Text>
            </View>
          </View>
        </SettingsCard>

        {activeAccount ? (
          <SettingsGroup title="Aktywny profil">
            <SettingsCard>
              <View style={styles.activeRow}>
                <View style={styles.activeIconWrap}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={appColors.primary} />
                </View>
                <View style={styles.activeBody}>
                  <Text style={styles.activeLabel}>Obecnie wybrany</Text>
                  <Text style={styles.activeValue} numberOfLines={1}>
                    {activeAccount.label ?? activeAccount.fullName}
                  </Text>
                </View>
              </View>
            </SettingsCard>
          </SettingsGroup>
        ) : null}

        {residentAccounts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="person-outline" size={28} color={appColors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Brak profili</Text>
            <Text style={styles.emptyDescription}>
              Nie znaleziono profili przypisanych do tego konta. Zaloguj sie ponownie lub skontaktuj
              sie z administratorem.
            </Text>
          </View>
        ) : (
          <SettingsGroup
            title="Dostępne profile"
            footer={`${residentAccounts.length} ${residentAccounts.length === 1 ? 'profil' : 'profile'} przypisane do numeru telefonu.`}>
            <View style={styles.cardsList}>
              {residentAccounts.map((account, index) => {
                const isActive = account.id === activeResidentAccountId;
                const isSelecting = selectingAccountId === account.id;

                return (
                  <ResidentAccountPickerCard
                    key={account.id}
                    account={account}
                    index={index}
                    selected={isActive}
                    selecting={isSelecting}
                    disabled={isWorking && !isSelecting}
                    onPress={() => {
                      void handleSelect(account.id);
                    }}
                  />
                );
              })}
            </View>
          </SettingsGroup>
        )}

        <SettingsGroup title="Nawigacja">
          <SettingsCard>
            <SettingsRow
              label="Wroc"
              icon="arrow-back-outline"
              onPress={() => router.back()}
              disabled={isWorking}
              showChevron={false}
            />
          </SettingsCard>
        </SettingsGroup>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: appTheme.spacing.lg,
  },
  heroCard: {
    overflow: 'visible',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.md,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.lg,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
  },
  heroBody: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    color: appColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  heroText: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: 12,
  },
  activeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
  },
  activeBody: {
    flex: 1,
    gap: 2,
  },
  activeLabel: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  activeValue: {
    color: appColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  cardsList: {
    gap: appTheme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    gap: appTheme.spacing.sm,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    borderRadius: 18,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.xl,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.primarySoft,
    marginBottom: appTheme.spacing.xs,
  },
  emptyTitle: {
    color: appColors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
