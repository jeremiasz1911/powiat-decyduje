import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button, ButtonText, Text } from '@gluestack-ui/themed';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { futuristicTheme, futuristicShadows } from '@/src/theme/futuristic';
import { RichDescriptionPreview } from './rich-description-preview';

const DESCRIPTION_ACTIONS = [
  { key: 'text', label: 'TXT' },
  { key: 'bold', label: 'B' },
  { key: 'italic', label: 'I' },
  { key: 'bullet', label: '•' },
  { key: 'number', label: '1.' },
  { key: 'h1', label: 'H1' },
  { key: 'h2', label: 'H2' },
  { key: 'h3', label: 'H3' },
  { key: 'h4', label: 'H4' },
  { key: 'h5', label: 'H5' },
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
  const [modes, setModes] = useState<EditorModes>(DEFAULT_MODES);
  const previousValueRef = useRef(value);

  useEffect(() => {
    previousValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!visible) {
      setModes(DEFAULT_MODES);
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
        <View style={styles.panel}>
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
                    style={styles.toolbarButton}
                    onPress={() => handleToggleAction(action.key)}>
                    <ButtonText color={active ? futuristicTheme.colors.textDark : futuristicTheme.colors.textPrimary}>
                      {action.label}
                    </ButtonText>
                  </Button>
                );
              })}
            </ScrollView>
            <Pressable onPress={onClose} style={styles.closeIconButton}>
              <Ionicons name="close" size={20} color={futuristicTheme.colors.textPrimary} />
            </Pressable>
          </View>

          <Text color={futuristicTheme.colors.textPrimary} style={styles.title}>
            {title}
          </Text>

          <View style={styles.previewEditorWrap}>
            <RichDescriptionPreview content={value} emptyPlaceholder="Zacznij pisac opis projektu..." />
            <TextInput
              value={value}
              onChangeText={handleChangeText}
              multiline
              autoFocus
              numberOfLines={18}
              textAlignVertical="top"
              caretHidden={false}
              selectionColor={futuristicTheme.colors.accent}
              placeholder="Napisz cel projektu, uzasadnienie, zakres i etapy realizacji."
              placeholderTextColor="transparent"
              style={styles.overlayInput}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 10, 24, 0.88)',
    justifyContent: 'center',
    padding: 12,
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: '#03182f',
    padding: 14,
    gap: 12,
    ...futuristicShadows.soft,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 10,
  },
  toolbarButton: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
    minWidth: 48,
  },
  previewEditorWrap: {
    borderColor: futuristicTheme.colors.border,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: futuristicTheme.colors.panel,
    minHeight: 460,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative',
  },
  overlayInput: {
    position: 'absolute',
    top: 10,
    right: 12,
    bottom: 10,
    left: 12,
    color: 'rgba(255, 255, 255, 0.01)',
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: 'transparent',
  },
});
