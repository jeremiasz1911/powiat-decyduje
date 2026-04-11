import { Ionicons } from '@expo/vector-icons';
import { Button, ButtonText, Text } from '@gluestack-ui/themed';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { futuristicTheme, futuristicShadows } from '@/src/theme/futuristic';
import { RichDescriptionPreview } from './rich-description-preview';

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
          <View style={styles.topNav}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar}>
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
              onChangeText={onChange}
              multiline
              autoFocus
              numberOfLines={16}
              textAlignVertical="top"
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
    minHeight: 420,
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
    color: 'transparent',
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: 'transparent',
  },
});
