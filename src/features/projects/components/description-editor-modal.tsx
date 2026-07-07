import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button, ButtonText, Text } from '@gluestack-ui/themed';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '@/src/theme/theme-context';
import type { AppColorTokens } from '@/src/theme/app-theme';
import { appShadows, appTheme } from '@/src/theme/app-theme';

import { RichDescriptionPreview } from './rich-description-preview';

const DESCRIPTION_ACTIONS = [
  { key: 'text', label: 'Tekst' },
  { key: 'bold', label: 'Pogrubienie' },
  { key: 'italic', label: 'Kursywa' },
  { key: 'bullet', label: 'Lista punktowa' },
  { key: 'number', label: 'Lista numerowana' },
  { key: 'h1', label: 'Naglowek 1' },
  { key: 'h2', label: 'Naglowek 2' },
  { key: 'h3', label: 'Naglowek 3' },
  { key: 'h4', label: 'Naglowek 4' },
  { key: 'h5', label: 'Naglowek 5' },
] as const;

type BlockMode = 'text' | 'bullet' | 'number' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5';

type EditorModes = {
  bold: boolean;
  italic: boolean;
  block: BlockMode;
};

type ActionKey = (typeof DESCRIPTION_ACTIONS)[number]['key'];

const DEFAULT_MODES: EditorModes = {
  bold: false,
  italic: false,
  block: 'text',
};

const blockPrefixMap: Record<BlockMode, string> = {
  text: '',
  bullet: '• ',
  number: '1. ',
  h1: '# ',
  h2: '## ',
  h3: '### ',
  h4: '#### ',
  h5: '##### ',
};

const blockModeLabelMap: Record<BlockMode, string> = {
  text: 'Tekst',
  bullet: 'Lista punktowa',
  number: 'Lista numerowana',
  h1: 'Naglowek 1',
  h2: 'Naglowek 2',
  h3: 'Naglowek 3',
  h4: 'Naglowek 4',
  h5: 'Naglowek 5',
};

const findCommonPrefixLength = (a: string, b: string) => {
  let i = 0;
  const max = Math.min(a.length, b.length);
  while (i < max && a[i] === b[i]) {
    i += 1;
  }
  return i;
};

const findCommonSuffixLength = (a: string, b: string, startOffset: number) => {
  let i = 0;
  const max = Math.min(a.length, b.length) - startOffset;
  while (i < max && a[a.length - 1 - i] === b[b.length - 1 - i]) {
    i += 1;
  }
  return i;
};

const formatSegment = (segment: string, modes: EditorModes, atLineStart: boolean) => {
  if (!segment) {
    return segment;
  }

  let formatted = segment;
  if (modes.bold && modes.italic) {
    formatted = `***${formatted}***`;
  } else if (modes.bold) {
    formatted = `**${formatted}**`;
  } else if (modes.italic) {
    formatted = `_${formatted}_`;
  }

  const prefix = atLineStart ? blockPrefixMap[modes.block] : '';
  return `${prefix}${formatted}`;
};

const formatInsertedChunk = (
  inserted: string,
  modes: EditorModes,
  startsAtLineBeginning: boolean
) => {
  if (!inserted) {
    return inserted;
  }

  if (!modes.bold && !modes.italic && modes.block === 'text') {
    return inserted;
  }

  const lines = inserted.split('\n');
  return lines
    .map((segment, index) => {
      const atLineStart = index === 0 ? startsAtLineBeginning : true;
      return formatSegment(segment, modes, atLineStart);
    })
    .join('\n');
};

function createEditorStyles(colors: AppColorTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      padding: 12,
    },
    panelScroll: {
      flex: 1,
    },
    panelScrollContent: {
      flexGrow: 1,
      paddingVertical: 16,
    },
    panel: {
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 14,
      gap: 12,
      ...appShadows.soft,
    },
    navSection: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surfaceSoft,
      padding: 8,
    },
    topNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    modeLabel: {
      fontSize: 12,
      fontWeight: '700',
    },
    closeIconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolbar: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 10,
    },
    toolbarButton: {
      minWidth: 48,
    },
    toolbarButtonInactive: {
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    toolbarButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryStrong,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.38,
      shadowRadius: 10,
      elevation: 9,
    },
    editorWrap: {
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 14,
      backgroundColor: colors.surfaceSoft,
      minHeight: 320,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    editorInput: {
      color: colors.textPrimary,
      fontSize: 16,
      lineHeight: 24,
      backgroundColor: 'transparent',
      minHeight: 300,
    },
    previewLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    previewWrap: {
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 14,
      backgroundColor: colors.surface,
      minHeight: 140,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
  });
}

type DescriptionEditorModalProps = {
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  title?: string;
};

export function DescriptionEditorModal({
  visible,
  value,
  onChange,
  onClose,
  title = 'Edytor opisu projektu',
}: DescriptionEditorModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createEditorStyles(colors), [colors]);
  const [modes, setModes] = useState<EditorModes>(DEFAULT_MODES);
  const [editorHeight, setEditorHeight] = useState(300);
  const previousValueRef = useRef(value);

  useEffect(() => {
    previousValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!visible) {
      setModes(DEFAULT_MODES);
      setEditorHeight(300);
    }
  }, [visible]);

  const activeActionMap = useMemo(
    () => ({
      text: modes.block === 'text' && !modes.bold && !modes.italic,
      bold: modes.bold,
      italic: modes.italic,
      bullet: modes.block === 'bullet',
      number: modes.block === 'number',
      h1: modes.block === 'h1',
      h2: modes.block === 'h2',
      h3: modes.block === 'h3',
      h4: modes.block === 'h4',
      h5: modes.block === 'h5',
    }),
    [modes]
  );

  const activeModeLabel = useMemo(() => {
    const parts: string[] = [];
    if (modes.bold) parts.push('Pogrubienie');
    if (modes.italic) parts.push('Kursywa');
    if (modes.block !== 'text') parts.push(blockModeLabelMap[modes.block]);
    return parts.length ? `Tryb aktywny: ${parts.join(' + ')}` : 'Tryb aktywny: Tekst';
  }, [modes]);

  const handleToggleAction = (actionKey: ActionKey) => {
    if (actionKey === 'text') {
      setModes(DEFAULT_MODES);
      return;
    }

    if (actionKey === 'bold') {
      setModes((prev) => ({ ...prev, bold: !prev.bold }));
      return;
    }

    if (actionKey === 'italic') {
      setModes((prev) => ({ ...prev, italic: !prev.italic }));
      return;
    }

    setModes((prev) => ({
      ...prev,
      block: prev.block === actionKey ? 'text' : actionKey,
    }));
  };

  const handleChangeText = (nextText: string) => {
    const previousText = previousValueRef.current;

    if (!nextText) {
      previousValueRef.current = '';
      onChange('');
      return;
    }

    const prefixLength = findCommonPrefixLength(previousText, nextText);
    const suffixLength = findCommonSuffixLength(previousText, nextText, prefixLength);

    const insertedText = nextText.slice(prefixLength, nextText.length - suffixLength);
    const removedText = previousText.slice(prefixLength, previousText.length - suffixLength);

    if (!insertedText || removedText.length > 0) {
      previousValueRef.current = nextText;
      onChange(nextText);
      return;
    }

    const startsAtLineBeginning = prefixLength === 0 || previousText[prefixLength - 1] === '\n';

    const formattedInsertedText = formatInsertedChunk(insertedText, modes, startsAtLineBeginning);

    const mergedText =
      previousText.slice(0, prefixLength) +
      formattedInsertedText +
      previousText.slice(previousText.length - suffixLength);

    previousValueRef.current = mergedText;
    onChange(mergedText);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView
          style={styles.panelScroll}
          contentContainerStyle={styles.panelScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.panel}>
            <View style={styles.navSection}>
              <View style={styles.topNav}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar}>
                  {DESCRIPTION_ACTIONS.map((action) => {
                    const active = activeActionMap[action.key];
                    return (
                      <Button
                        key={action.key}
                        size="xs"
                        variant={active ? 'solid' : 'outline'}
                        action={active ? 'primary' : 'secondary'}
                        style={[
                          styles.toolbarButton,
                          active ? styles.toolbarButtonActive : styles.toolbarButtonInactive,
                        ]}
                        onPress={() => handleToggleAction(action.key)}>
                        <ButtonText color={active ? colors.textOnPrimary : colors.textPrimary}>
                          {action.label}
                        </ButtonText>
                      </Button>
                    );
                  })}
                </ScrollView>
                <Pressable onPress={onClose} style={styles.closeIconButton}>
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </Pressable>
              </View>
            </View>

            <Text color={colors.textPrimary} style={styles.title}>
              {title}
            </Text>
            <Text color={colors.primary} style={styles.modeLabel}>
              {activeModeLabel}
            </Text>

            <View style={styles.editorWrap}>
              <TextInput
                value={value}
                onChangeText={handleChangeText}
                multiline
                autoFocus
                numberOfLines={18}
                textAlignVertical="top"
                scrollEnabled={false}
                selectionColor={colors.primary}
                placeholder="Napisz cel projektu, uzasadnienie, zakres i etapy realizacji."
                placeholderTextColor={colors.placeholder}
                style={[styles.editorInput, { height: Math.max(300, editorHeight) }]}
                onContentSizeChange={(event) => {
                  setEditorHeight(event.nativeEvent.contentSize.height + 10);
                }}
              />
            </View>

            <Text color={colors.textMuted} style={styles.previewLabel}>
              Podglad formatowania
            </Text>
            <View style={styles.previewWrap}>
              <RichDescriptionPreview content={value} emptyPlaceholder="Zacznij pisac opis projektu..." />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
