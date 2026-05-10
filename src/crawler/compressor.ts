export function compressContent(text: string, maxLength = 50000): string {
  return text.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function splitIntoSections(
  sections: { heading: string; text: string }[],
  maxChunkSize = 10000
): { heading: string; text: string }[] {
  const result: { heading: string; text: string }[] = [];
  for (const section of sections) {
    if (section.text.length > maxChunkSize) {
      const chunks = chunkText(section.text, maxChunkSize);
      chunks.forEach((chunk, i) => {
        result.push({
          heading: i === 0 ? section.heading : `${section.heading} (cont.)`,
          text: chunk,
        });
      });
    } else {
      result.push(section);
    }
  }
  return result;
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}
