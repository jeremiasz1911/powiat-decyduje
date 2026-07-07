import { StyleSheet, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';

import { useAppTheme } from '@/src/theme/theme-context';

type RichDescriptionPreviewProps = {
  content: string;
  emptyPlaceholder?: string;
  compact?: boolean;
};

type InlineSegment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
};

const parseInline = (value: string): InlineSegment[] => {
  const segments: InlineSegment[] = [];
  const regex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|_[^_]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  match = regex.exec(value);
  while (match) {
    if (match.index > lastIndex) {
      segments.push({ text: value.slice(lastIndex, match.index) });
    }

    const token = match[0];
    if (token.startsWith('***') && token.endsWith('***')) {
      segments.push({ text: token.slice(3, -3), bold: true, italic: true });
    } else if (token.startsWith('**') && token.endsWith('**')) {
      segments.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith('_') && token.endsWith('_')) {
      segments.push({ text: token.slice(1, -1), italic: true });
    } else {
      segments.push({ text: token });
    }

    lastIndex = match.index + token.length;
    match = regex.exec(value);
  }

  if (lastIndex < value.length) {
    segments.push({ text: value.slice(lastIndex) });
  }

  return segments;
};

export function RichDescriptionPreview({
  content,
  emptyPlaceholder = 'Brak opisu',
  compact = false,
}: RichDescriptionPreviewProps) {
  const { colors } = useAppTheme();
  const lines = content.split('\n');
  const hasContent = content.trim().length > 0;

  const renderInline = (value: string) =>
    parseInline(value).map((segment, index) => (
      <Text
        key={`${segment.text}-${index}`}
        color={colors.textPrimary}
        style={[
          compact ? styles.baseTextCompact : styles.baseText,
          segment.bold ? styles.bold : null,
          segment.italic ? styles.italic : null,
        ]}>
        {segment.text}
      </Text>
    ));

  if (!hasContent) {
    return (
      <Text color={colors.textMuted} style={compact ? styles.baseTextCompact : styles.baseText}>
        {emptyPlaceholder}
      </Text>
    );
  }

  return (
    <View style={styles.previewWrap}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        const h5 = trimmed.startsWith('##### ');
        const h4 = trimmed.startsWith('#### ');
        const h3 = trimmed.startsWith('### ');
        const h2 = trimmed.startsWith('## ');
        const h1 = trimmed.startsWith('# ');
        const bullet = trimmed.startsWith('• ');
        const numbered = /^\d+\.\s+/.test(trimmed);

        if (!trimmed) {
          return <View key={`empty-${index}`} style={compact ? styles.emptyLineCompact : styles.emptyLine} />;
        }

        if (h1 || h2 || h3 || h4 || h5) {
          const text = trimmed.replace(/^#+\s+/, '');
          return (
            <Text
              key={`h-${index}`}
              color={colors.textPrimary}
              style={[
                styles.headingBase,
                h1 ? styles.h1 : null,
                h2 ? styles.h2 : null,
                h3 ? styles.h3 : null,
                h4 ? styles.h4 : null,
                h5 ? styles.h5 : null,
              ]}>
              {text}
            </Text>
          );
        }

        if (bullet) {
          return (
            <View key={`b-${index}`} style={styles.listRow}>
              <Text color={colors.primary} style={styles.listPrefix}>
                •
              </Text>
              <Text color={colors.textPrimary} style={compact ? styles.baseTextCompact : styles.baseText}>
                {renderInline(trimmed.slice(2))}
              </Text>
            </View>
          );
        }

        if (numbered) {
          const match = trimmed.match(/^(\d+\.)\s+(.*)$/);
          if (match) {
            return (
              <View key={`n-${index}`} style={styles.listRow}>
                <Text color={colors.primary} style={styles.listPrefix}>
                  {match[1]}
                </Text>
                <Text color={colors.textPrimary} style={compact ? styles.baseTextCompact : styles.baseText}>
                  {renderInline(match[2])}
                </Text>
              </View>
            );
          }
        }

        return (
          <Text
            key={`p-${index}`}
            color={colors.textPrimary}
            style={compact ? styles.baseTextCompact : styles.baseText}>
            {renderInline(trimmed)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  previewWrap: {
    gap: 2,
  },
  baseText: {
    fontSize: 15,
    lineHeight: 22,
  },
  baseTextCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  headingBase: {
    fontWeight: '800',
    marginTop: 2,
  },
  h1: {
    fontSize: 24,
    lineHeight: 30,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
  },
  h3: {
    fontSize: 20,
    lineHeight: 26,
  },
  h4: {
    fontSize: 18,
    lineHeight: 24,
  },
  h5: {
    fontSize: 16,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '800',
  },
  italic: {
    fontStyle: 'italic',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingRight: 8,
  },
  listPrefix: {
    minWidth: 22,
    fontWeight: '700',
  },
  emptyLine: {
    height: 12,
  },
  emptyLineCompact: {
    height: 8,
  },
});
