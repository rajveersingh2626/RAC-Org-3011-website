/**
 * Native XLSX Reader for RY 2026-27.xlsx
 * Uses standard DecompressionStream API (supported in Node 18+ and modern browsers)
 */

import excelFileUrl from '../../President Database 2026-27.xlsx?url';

export async function parseExcelClubs(fileUrl = excelFileUrl) {
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Helper to find file entry in zip
    const getZipFile = async (targetName) => {
      let pos = 0;
      while (pos < bytes.length - 30) {
        if (bytes[pos] === 0x50 && bytes[pos+1] === 0x4b && bytes[pos+2] === 0x03 && bytes[pos+3] === 0x04) {
          const compMethod = bytes[pos+8] | (bytes[pos+9] << 8);
          const compSize = bytes[pos+18] | (bytes[pos+19] << 8) | (bytes[pos+20] << 16) | (bytes[pos+21] << 24);
          const nameLen = bytes[pos+26] | (bytes[pos+27] << 8);
          const extraLen = bytes[pos+28] | (bytes[pos+29] << 8);
          const nameBytes = bytes.subarray(pos + 30, pos + 30 + nameLen);
          const fileName = new TextDecoder().decode(nameBytes);
          const dataStart = pos + 30 + nameLen + extraLen;
          
          if (fileName.toLowerCase() === targetName.toLowerCase()) {
            const compressedData = bytes.subarray(dataStart, dataStart + compSize);
            if (compMethod === 0) {
              return new TextDecoder().decode(compressedData);
            } else if (compMethod === 8) {
              const ds = new DecompressionStream('deflate-raw');
              const writer = ds.writable.getWriter();
              writer.write(compressedData);
              writer.close();
              const response = new Response(ds.readable);
              const buf = await response.arrayBuffer();
              return new TextDecoder().decode(buf);
            }
          }
          pos = dataStart + compSize;
        } else {
          pos++;
        }
      }
      return null;
    };

    const sharedStringsXml = await getZipFile('xl/sharedStrings.xml');
    const sheetXml = await getZipFile('xl/worksheets/sheet1.xml');

    if (!sheetXml) return null;

    // Parse Shared Strings array
    const sharedStrings = [];
    if (sharedStringsXml) {
      const siMatches = sharedStringsXml.match(/<si>(.*?)<\/si>/gs) || [];
      siMatches.forEach(si => {
        const textParts = [...si.matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map(m => m[1]);
        sharedStrings.push(textParts.join(''));
      });
      if (sharedStrings.length === 0) {
        const stringMatches = [...sharedStringsXml.matchAll(/<t[^>]*>(.*?)<\/t>/g)];
        stringMatches.forEach(m => sharedStrings.push(m[1]));
      }
    }

    // Parse Rows & Cells
    const rowMatches = [...sheetXml.matchAll(/<row[^>]*>(.*?)<\/row>/gs)];
    const rows = [];

    rowMatches.forEach(rowMatch => {
      const rowContent = rowMatch[1];
      const cellMatches = [...rowContent.matchAll(/<c\s+([^>]*?)>(.*?)<\/c>/gs)];
      const rowData = {};

      cellMatches.forEach(cMatch => {
        const attrs = cMatch[1];
        const inner = cMatch[2];

        const rMatch = attrs.match(/r="([A-Z]+)\d+"/);
        if (!rMatch) return;
        const col = rMatch[1];

        const tMatch = attrs.match(/t="([^"]+)"/);
        const type = tMatch ? tMatch[1] : null;

        const vMatch = inner.match(/<v>(.*?)<\/v>/);
        const val = vMatch ? vMatch[1] : null;

        const tInnerMatch = inner.match(/<t[^>]*>(.*?)<\/t>/);
        const inlineText = tInnerMatch ? tInnerMatch[1] : null;

        if (type === 's' && val !== null) {
          const stringIndex = parseInt(val, 10);
          rowData[col] = sharedStrings[stringIndex] || '';
        } else if (inlineText !== null) {
          rowData[col] = inlineText;
        } else if (val !== null) {
          rowData[col] = val;
        }
      });

      if (Object.keys(rowData).length > 0) {
        rows.push(rowData);
      }
    });

    return rows;
  } catch (err) {
    console.warn('XLSX parsing notice:', err);
    return null;
  }
}

/**
 * Smart Excel Club & Officer Extractor for District 3011
 */
export async function getParsedClubsFromExcel(fileUrl = excelFileUrl) {
  const rows = await parseExcelClubs(fileUrl);
  if (!rows || rows.length === 0) return null;

  let clubCol = null;
  let presidentCol = null;
  let isDirectorCol = null;
  let zoneCol = null;
  let phoneCol = null;
  let emailCol = null;

  let headerRowIndex = -1;

  // Search first 10 rows for header column titles
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    for (const [col, val] of Object.entries(row)) {
      const v = String(val).toLowerCase().trim();
      if ((v.includes('club') && (v.includes('name') || v.includes('rotaract') || v === 'club')) || v === 'club name') {
        clubCol = col;
        headerRowIndex = i;
      }
      if (v.includes('president') || v === 'pres' || v.includes('president name')) {
        presidentCol = col;
      }
      if (v.includes('international') || v.includes('is director') || v.includes('isd') || v.includes('dir is') || (v.includes('director') && v.includes('service'))) {
        isDirectorCol = col;
      }
      if (v.includes('zone')) {
        zoneCol = col;
      }
      if (v.includes('phone') || v.includes('contact') || v.includes('mobile') || v.includes('number')) {
        phoneCol = col;
      }
      if (v.includes('email') || v.includes('mail')) {
        emailCol = col;
      }
    }
    if (clubCol && (presidentCol || isDirectorCol)) break;
  }

  // If columns were not matched by header titles, look at cell contents across rows
  const parsedClubs = [];
  const startIdx = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    let clubName = clubCol ? row[clubCol] : null;

    if (!clubName) {
      for (const [col, val] of Object.entries(row)) {
        const v = String(val).trim();
        if (v.toLowerCase().includes('rotaract') || v.toLowerCase().includes('rac ')) {
          clubName = v;
          break;
        }
      }
    }

    if (!clubName || typeof clubName !== 'string') continue;

    clubName = clubName.trim();
    if (clubName.toLowerCase() === 'club name' || clubName.toLowerCase() === 'name of the club' || clubName.toLowerCase().includes('s.no')) continue;

    // Normalize specific official club names & presidents
    if (clubName.toLowerCase().includes('genesis midwest')) {
      if (!clubName.toLowerCase().includes('delhi genesis midwest')) {
        clubName = clubName.replace(/genesis midwest/i, 'Delhi Genesis Midwest');
      }
      president = 'Rtr. Aditi Singhal';
    }

    let president = presidentCol && row[presidentCol] ? String(row[presidentCol]).trim() : '';
    let isDirector = isDirectorCol && row[isDirectorCol] ? String(row[isDirectorCol]).trim() : '';
    let zone = zoneCol && row[zoneCol] ? String(row[zoneCol]).trim() : '';
    let phone = phoneCol && row[phoneCol] ? String(row[phoneCol]).trim() : '';
    let email = emailCol && row[emailCol] ? String(row[emailCol]).trim() : '';

    if (president && !president.startsWith('Rtr')) {
      president = `Rtr. ${president}`;
    }
    if (isDirector && !isDirector.startsWith('Rtr')) {
      isDirector = `Rtr. ${isDirector}`;
    }

    parsedClubs.push({
      id: `excel-${i}`,
      name: clubName,
      shortName: clubName.replace(/^(Rotaract\s+(Club\s+of\s+)?|RAC\s+)/i, '').trim(),
      president: president || '',
      isDirector: isDirector || '',
      zone: zone || '',
      phone: phone || '',
      email: email || '',
      brief: '',
      charterYear: '',
      members: '',
      initiatives: []
    });
  }

  return parsedClubs;
}


