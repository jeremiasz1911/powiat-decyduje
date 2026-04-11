import { Ionicons } from '@expo/vector-icons';
import { Button, ButtonText, Text } from '@gluestack-ui/themed';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { futuristicTheme, futuristicShadows } from '@/src/theme/futuristic';

const DESCRIPTION_ACTIONS = [
  { key: 'text', label: 'TXT', template: '' },
  { key: 'bold', label: 'B', template: '**pogrubienie**' },
  { key: 'italic', label: 'I', template: '_kursywa_' },
  { key: 'bullet', label: '•', template: '• ' },
  { key: 'number', label: '1.', template: '1. ' },
  { key: 'h1', label: 'H1', template: '# ' },
  { key: 'h2', label: 'H2', template: '## ' },
  { key: 'h3', label: 'H3', template: '### ' },
  { key: 'h4', label: 'H4', template: '#### ' },
  { key: 'h5', label: 'H5', template: '##### ' },
] as const;

type DescriptionEditorModalProps = {
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  title?: string;
};

const applyTemplate = (
  currentValue: string,
  template: (typeof DESCRIPTION_ACTIONS)[number]['template']
) => {
  if (!template) {
    return currentValue;
  }

  if (template === '**pogrubienie**' || template === '_kursywa_') {
    return `${currentValue}${currentValue ? ' ' : ''}${template}`;
  }

  return `${currentValue}${currentValue ? '\n' : ''}${template}`;
};

export function DescriptionEditorModal({
  visible,
  value,
  onChange,
  onClose,
  title = 'Edytor opisu projektu',
}: DescriptionEditorModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text color={futuristicTheme.colors.textPrimary} style={styles.title}>
              {title}
            </Text>
            <Button onPress={onClose} size="sm" variant="outline" action="secondary" style={styles.headerButton}>
              <Ionicons name="close" size={16} color={futuristicTheme.colors.textPrimary} />
              <ButtonText color={futuristicTheme.colors.textPrimary}>Zamknij</ButtonText>
            </Button>
          </View>

          <View style={styles.toolbar}>
            {DESCRIPTION_ACTIONS.map((action) => (
              <Button
                key={action.key}
                size="xs"
                variant="outline"
                action="secondary"
                style={styles.toolbarButton}
                onPress={() => onChange(applyTemplate(value, action.template))}>
                <ButtonText color={futuristicTheme.colors.textPrimary}>{action.label}</ButtonText>
              </Button>
            ))}
          </View>

          <View style={styles.editorWrap}>
            <TextInput
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={12}
              textAlignVertical="top"
              placeholder="Napisz cel projektu, uzasadnienie, zakres i etapy realizacji."
              placeholderTextColor={futuristicTheme.colors.textMuted}
              style={styles.editorInput}
            />
          </View>

          <Text color={futuristicTheme.colors.textMuted}>
            Uzyj: B, I, list i H1-H5. To pole wspiera strukture i czytelny opis.
          </Text>

          <Pressable onPress={onClose} style={styles.doneButtonWrap}>
            <View style={styles.doneButton}>
              <Text color={futuristicTheme.colors.textDark} style={styles.doneButtonText}>
                Zapisz i wroc
              </Text>
            </View>
          </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerButton: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolbarButton: {
    borderColor: futuristicTheme.colors.border,
    backgroundColor: futuristicTheme.colors.panelSoft,
    minWidth: 48,
  },
  editorWrap: {
    borderColor: futuristicTheme.colors.border,
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: futuristicTheme.colors.panel,
    minHeight: 320,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  editorInput: {
    flex: 1,
    minHeight: 300,
    color: futuristicTheme.colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
  },
  doneButtonWrap: {
    marginTop: 4,
  },
  doneButton: {
    borderRadius: 12,
    backgroundColor: futuristicTheme.colors.accent,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...futuristicShadows.glow,
  },
  doneButtonText: {
    fontWeight: '700',
  },
});
