import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { ErrorState, LoadingState } from '@/src/components/feedback-state';
import { AppScreen } from '@/src/components/layout/app-screen';
import { ScreenContainer } from '@/src/components/screen-container';
import { SettingsCard, SettingsGroup, SettingsRow } from '@/src/components/settings/settings-ui';
import { AppButton } from '@/src/components/ui/AppButton';
import { AppTextInput } from '@/src/components/ui/AppTextInput';
import {
  ProfileDetailRow,
  ProfileHero,
  ProfileVerificationBadge,
} from '@/src/features/profile/components/profile-ui';
import {
  residentProfileEditSchema,
  type ResidentProfileEditValues,
} from '@/src/features/profile/resident-profile.schema';
import { useAppFeedback } from '@/src/hooks/use-app-feedback';
import { usePrivateRoute } from '@/src/hooks/use-private-route';
import {
  getResidentAccountProfile,
  requireSignedInUser,
  upsertResidentAccountProfile,
  type ResidentAccount,
  type ResidentProfile,
} from '@/src/services';
import { useAuthContext } from '@/src/store/auth-context';
import { useSettings, type FontScalePreference, type ThemePreference } from '@/src/store/settings-context';
import { useAppTheme } from '@/src/theme/theme-context';
import { appTheme } from '@/src/theme/app-theme';

const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'Systemowy',
  light: 'Jasny',
  dark: 'Ciemny',
};

const FONT_SCALE_LABELS: Record<FontScalePreference, string> = {
  normal: 'Normalny',
  large: 'Wiekszy',
  xlarge: 'Bardzo duzy',
};

function formatAddress(account: ResidentAccount | null): string | null {
  if (!account?.address) {
    return null;
  }

  const { street, houseNumber, apartmentNumber, postalCode, city } = account.address;
  const parts = [
    [street, houseNumber].filter(Boolean).join(' '),
    apartmentNumber ? `lok. ${apartmentNumber}` : null,
    [postalCode, city].filter(Boolean).join(' '),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : null;
}

function maskPesel(pesel: string): string {
  if (pesel.length < 4) {
    return pesel;
  }

  return `•••••••${pesel.slice(-4)}`;
}

function buildProfileValues(
  account: ResidentAccount | null,
  profile: ResidentProfile | null
): ResidentProfileEditValues {
  return {
    fullName: profile?.fullName || account?.fullName || account?.label || '',
    email: profile?.email || account?.email || '',
    phone: profile?.phone || account?.phoneNumber || '',
    village: profile?.village || account?.commune || account?.address?.commune || 'Mlawa',
    street: profile?.street || formatAddress(account)?.split(', ')[0] || '',
  };
}

function resolveAccountStatus(account: ResidentAccount | null, profile: ResidentProfile | null): string {
  if (!account) {
    return 'Brak konta';
  }

  if (account.phoneVerified && account.residentStatus === 'verified_resident') {
    return profile ? 'Profil uzupelniony' : 'Konto zweryfikowane';
  }

  if (account.phoneVerified) {
    return 'Telefon zweryfikowany';
  }

  return 'Oczekuje weryfikacji';
}

export default function DrawerProfileScreen() {
  const router = useRouter();
  const { notify } = useAppFeedback();
  const { colors } = useAppTheme();
  const canAccessPrivateFeatures = usePrivateRoute();
  const { settings } = useSettings();
  const { activeResidentAccount, refreshResidentAccounts, logout } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ResidentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const defaultValues = useMemo(
    () => buildProfileValues(activeResidentAccount, profile),
    [activeResidentAccount, profile]
  );

  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ResidentProfileEditValues>({
    resolver: zodResolver(residentProfileEditSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const user = await requireSignedInUser();
      setUid(user.uid);

      if (!activeResidentAccount) {
        throw new Error('Wybierz aktywne konto mieszkanca, aby wyswietlic profil.');
      }

      const loadedProfile = await getResidentAccountProfile(user.uid, activeResidentAccount.id);
      setProfile(loadedProfile);
      reset(buildProfileValues(activeResidentAccount, loadedProfile));
    } catch (loadError) {
      const rawMessage = loadError instanceof Error ? loadError.message : 'Nie udalo sie pobrac profilu.';
      const isPermissionError =
        rawMessage.includes('Missing or insufficient permissions') ||
        rawMessage.includes('permission-denied');

      const message = isPermissionError
        ? 'Brak uprawnien do odczytu profilu. Sprobuj ponownie za chwile lub skontaktuj sie z administratorem.'
        : rawMessage;

      setProfile(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeResidentAccount, reset]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const displayValues = useMemo(
    () => buildProfileValues(activeResidentAccount, profile),
    [activeResidentAccount, profile]
  );

  const accountStatus = resolveAccountStatus(activeResidentAccount, profile);
  const formattedAddress = formatAddress(activeResidentAccount);
  const communeLabel = activeResidentAccount?.commune ?? displayValues.village ?? 'Mlawa';
  const hasMissingContact =
    !displayValues.fullName.trim() ||
    !(displayValues.phone ?? '').trim() ||
    !(displayValues.email ?? '').trim();

  const onSubmit = async (values: ResidentProfileEditValues) => {
    if (!uid) {
      await notify('Brak sesji', 'Nie mozna zapisac profilu bez aktywnego uzytkownika.', 'error');
      return;
    }

    if (!activeResidentAccount) {
      await notify('Brak profilu', 'Wybierz konto mieszkanca przed zapisem profilu.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      await upsertResidentAccountProfile({
        uid,
        residentAccountId: activeResidentAccount.id,
        fullName: values.fullName,
        email: values.email || undefined,
        phone: values.phone || undefined,
        village: values.village,
        street: values.street || undefined,
      });
      await refreshResidentAccounts();

      const nextProfile = await getResidentAccountProfile(uid, activeResidentAccount.id);
      setProfile(nextProfile);
      reset(buildProfileValues(activeResidentAccount, nextProfile));
      setIsEditing(false);

      await notify('Profil zaktualizowany', 'Dane konta zostaly zapisane.', 'success');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Nie udalo sie zapisac profilu.';
      await notify('Blad zapisu', message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
      await notify('Wylogowano', 'Wylogowano z konta mieszkanca.', 'success');
      router.replace('/login-phone');
    } catch (logoutError) {
      const message = logoutError instanceof Error ? logoutError.message : 'Nie udalo sie wylogowac.';
      await notify('Blad wylogowania', message, 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCancelEdit = () => {
    reset(displayValues);
    setIsEditing(false);
  };

  const openSettings = () => {
    router.push('/(drawer)/(tabs)/settings');
  };

  if (!canAccessPrivateFeatures) {
    return null;
  }

  if (loading) {
    return (
      <AppScreen cherryBackground contentContainerStyle={styles.centeredState}>
        <LoadingState label="Laduje profil..." />
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen cherryBackground contentContainerStyle={styles.centeredState}>
        <ErrorState
          message={error}
          actionLabel={activeResidentAccount ? 'Sprobuj ponownie' : 'Wybierz konto'}
          onActionPress={() => {
            if (activeResidentAccount) {
              void loadProfile();
              return;
            }

            router.push('/select-resident-account');
          }}
        />
      </AppScreen>
    );
  }

  const displayName =
    displayValues.fullName.trim() ||
    activeResidentAccount?.label ||
    `${activeResidentAccount?.firstName ?? ''} ${activeResidentAccount?.lastName ?? ''}`.trim() ||
    'Mieszkaniec';

  const profileLabel = activeResidentAccount?.label ?? displayName;
  const declarationNote = activeResidentAccount?.consents?.residentDeclaration
    ? 'Oswiadczenie mieszkanca zostalo zlozone podczas rejestracji.'
    : undefined;

  return (
    <ScreenContainer title="Profil mieszkańca" description="Dane konta, preferencje i sesja.">
      <View style={styles.sections}>
        <ProfileHero
          name={displayName}
          subtitle={`Mieszkaniec · ${communeLabel}`}
          statusLabel={accountStatus}
          verified={Boolean(activeResidentAccount?.phoneVerified)}
        />

        {hasMissingContact && !isEditing ? (
          <View style={[styles.notice, { borderColor: colors.border }]}>
            <View style={[styles.noticeIconWrap, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
              Niektóre dane kontaktowe są niekompletne. Uzupełnij je w sekcji edycji.
            </Text>
          </View>
        ) : null}

        {!isEditing ? (
          <>
            <SettingsGroup title="Dane uzytkownika">
              <SettingsCard>
                <ProfileDetailRow icon="person-outline" label="Imie i nazwisko" value={displayName} />
                <ProfileDetailRow icon="business-outline" label="Gmina" value={communeLabel} />
                <ProfileDetailRow
                  icon="location-outline"
                  label="Adres"
                  value={formattedAddress || (displayValues.street ?? '').trim() || 'Brak'}
                />
              </SettingsCard>
            </SettingsGroup>

            <SettingsGroup title="Dane konta" footer={declarationNote}>
              <SettingsCard>
                <ProfileDetailRow
                  icon="call-outline"
                  label="Telefon"
                  value={(displayValues.phone ?? '').trim() || 'Brak'}
                  badge={
                    activeResidentAccount ? (
                      <ProfileVerificationBadge verified={activeResidentAccount.phoneVerified} />
                    ) : null
                  }
                />
                <ProfileDetailRow
                  icon="mail-outline"
                  label="E-mail"
                  value={(displayValues.email ?? '').trim() || 'Brak'}
                  badge={
                    activeResidentAccount ? (
                      <ProfileVerificationBadge verified={activeResidentAccount.emailVerified} />
                    ) : null
                  }
                />
                <ProfileDetailRow
                  icon="id-card-outline"
                  label="PESEL"
                  value={activeResidentAccount ? maskPesel(activeResidentAccount.pesel) : 'Brak'}
                />
                <ProfileDetailRow icon="people-outline" label="Profil mieszkanca" value={profileLabel} />
              </SettingsCard>
            </SettingsGroup>

            <SettingsGroup title="Preferencje" footer="Pełna konfiguracja dostępna w ustawieniach aplikacji.">
              <SettingsCard>
                <SettingsRow
                  icon="color-palette-outline"
                  label="Motyw"
                  value={THEME_LABELS[settings.theme]}
                  onPress={openSettings}
                />
                <SettingsRow
                  icon="text-outline"
                  label="Rozmiar tekstu"
                  value={FONT_SCALE_LABELS[settings.fontScale]}
                  onPress={openSettings}
                />
                <SettingsRow
                  icon="phone-portrait-outline"
                  label="Wibracje"
                  value={settings.hapticsEnabled ? 'Włączone' : 'Wyłączone'}
                  onPress={openSettings}
                />
              </SettingsCard>
            </SettingsGroup>

            <View style={styles.actions}>
              <AppButton title="Edytuj profil" onPress={() => setIsEditing(true)} />
              <AppButton
                title="Zmień profil mieszkańca"
                variant="secondary"
                onPress={() => router.push('/select-resident-account')}
              />
              <AppButton
                title={isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj'}
                variant="danger"
                loading={isLoggingOut}
                disabled={isLoggingOut}
                onPress={() => void handleLogout()}
              />
            </View>
          </>
        ) : (
          <>
            <SettingsGroup
              title="Edycja profilu"
              footer="Oświadczenie mieszkańca nie wymaga ponownego potwierdzenia.">
              <View style={styles.form}>
                  <Controller
                    control={control}
                    name="fullName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppTextInput
                        label="Imie i nazwisko"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Np. Jan Kowalski"
                        error={errors.fullName?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppTextInput
                        label="Telefon"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Np. 600700800"
                        keyboardType="phone-pad"
                        error={errors.phone?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppTextInput
                        label="E-mail"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="jan@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="village"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppTextInput
                        label="Miejscowosc"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Mlawa"
                        error={errors.village?.message}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="street"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppTextInput
                        label="Ulica i nr (opcjonalnie)"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Np. Sienkiewicza 12"
                        error={errors.street?.message}
                      />
                    )}
                  />
                </View>
            </SettingsGroup>

            <View style={styles.actions}>
              <AppButton
                title={isSaving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                loading={isSaving}
                disabled={isSaving}
                onPress={handleSubmit(onSubmit)}
              />
              <AppButton
                title="Anuluj edycję"
                variant="secondary"
                disabled={isSaving}
                onPress={handleCancelEdit}
              />
            </View>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: appTheme.spacing.lg,
  },
  centeredState: {
    flexGrow: 1,
    paddingHorizontal: appTheme.spacing.xl,
    paddingVertical: appTheme.spacing.xxl,
    justifyContent: 'center',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: appTheme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: appTheme.spacing.md,
  },
  noticeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: appTheme.spacing.md,
  },
  actions: {
    gap: appTheme.spacing.sm,
    paddingTop: appTheme.spacing.sm,
  },
});
