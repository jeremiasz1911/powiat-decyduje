import type { LegalBlock } from './legal-content';

/** Konwertuje bloki prawne na tekst edytowalny w panelu admina. */
export function legalBlocksToText(blocks: LegalBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'h2') return `## ${block.text}`;
      if (block.type === 'p') return block.text;
      if (block.type === 'ul') return block.items.map((item) => `- ${item}`).join('\n');
      if (block.type === 'link') {
        const prefix = block.before ?? '';
        const suffix = block.after ?? '';
        return `${prefix}${block.label}${suffix}`.trim();
      }
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

/** Parsuje tekst z panelu admina z powrotem na bloki prawne. */
export function legalTextToBlocks(text: string): LegalBlock[] {
  const sections = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const blocks: LegalBlock[] = [];

  for (const section of sections) {
    if (section.startsWith('## ')) {
      blocks.push({ type: 'h2', text: section.slice(3).trim() });
      continue;
    }

    const lines = section.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length > 0 && lines.every((line) => line.startsWith('- '))) {
      blocks.push({ type: 'ul', items: lines.map((line) => line.slice(2).trim()) });
      continue;
    }

    if (/^kontakt@powiatdecyduje\.pl$/i.test(section)) {
      blocks.push({
        type: 'link',
        href: 'mailto:kontakt@powiatdecyduje.pl',
        label: 'kontakt@powiatdecyduje.pl',
      });
      continue;
    }

    blocks.push({ type: 'p', text: section.replace(/\n/g, ' ') });
  }

  return blocks;
}
