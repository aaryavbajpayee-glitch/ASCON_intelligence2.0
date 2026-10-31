/**
 * RFC 4180 Compliant Client-side CSV Parser & Serializer
 * Zero external dependencies. Robust handling of quotes, commas, and newlines.
 */

export interface ParsedCSV {
  headers: string[];
  rows: string[][];
  rowCount: number;
  columnCount: number;
  hasHeaders: boolean;
  rawFilename?: string;
  fileSizeBytes?: number;
}

/**
 * Parses raw CSV text into headers and matrix of rows
 */
export function parseCSV(csvText: string): ParsedCSV {
  // 1. Strip UTF-8 Byte Order Mark (BOM) if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const rawRows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" inside quotes becomes "
          currentField += '"';
          i++; // skip next quote
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        // Handle CRLF or standalone CR
        if (nextChar === '\n') {
          i++; // skip \n
        }
        currentRow.push(currentField);
        rawRows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rawRows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push final field/row if not empty
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rawRows.push(currentRow);
  }

  // Filter out completely empty trailing lines
  const nonEmptyRows = rawRows.filter(
    (row) => row.length > 1 || (row.length === 1 && row[0].trim() !== '')
  );

  if (nonEmptyRows.length === 0) {
    throw new Error('CSV file is empty or contains no parseable data.');
  }

  // First non-empty row becomes headers
  const headers = nonEmptyRows[0].map((h, idx) => (h.trim() ? h.trim() : `Column_${idx + 1}`));
  const dataRows = nonEmptyRows.slice(1);

  // Normalize all rows to match header count
  const normalizedRows = dataRows.map((row) => {
    if (row.length < headers.length) {
      const padded = [...row];
      while (padded.length < headers.length) {
        padded.push('');
      }
      return padded;
    }
    return row;
  });

  return {
    headers,
    rows: normalizedRows,
    rowCount: normalizedRows.length,
    columnCount: headers.length,
    hasHeaders: true,
  };
}

/**
 * Escapes an individual cell value according to RFC 4180
 */
export function escapeCSVCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  // If field contains comma, quote, newline, or carriage return, escape quotes and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Deterministically serializes a CSV row into a canonical byte string for hashing.
 * Guarantees that identical original records produce identical cryptographic digests.
 */
export function serializeRowCanonical(row: string[], headers?: string[]): string {
  if (headers && headers.length === row.length) {
    // Canonical key-value JSON stringification for maximum cross-platform reproducibility
    const record: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i]] = row[i] ?? '';
    }
    return JSON.stringify(record);
  }
  // Fallback to strict escaped CSV row
  return row.map(escapeCSVCell).join(',');
}

/**
 * Builds full CSV document string from headers and rows
 */
export function generateCSVString(headers: string[], rows: (string | number | boolean)[][]): string {
  const headerLine = headers.map(escapeCSVCell).join(',');
  const rowLines = rows.map((r) => r.map(escapeCSVCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Triggers native browser download for CSV text
 */
export function triggerCSVDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
