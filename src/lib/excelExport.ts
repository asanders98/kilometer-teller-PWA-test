import { unzipSync, strToU8, zipSync } from 'fflate'
import type { KmEntry, AppSettings } from '../types'
import { getDutchMonthName, parseDateKey } from './dateUtils'
import { calculateKm } from './calculations'

// Maximum data rows in the Excel template (rows 11–39)
const MAX_ROWS = 29

/**
 * Pick entries that go into the Excel template. Sorts chronologically and
 * caps at `maxRows`. Includes every filled day (weekends too) — weekend
 * entries used to be dropped by an old workdays-only filter.
 */
export function selectEntriesForExport(allEntries: KmEntry[], maxRows: number): KmEntry[] {
  return [...allEntries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, maxRows)
}

// Convert a JS Date to Excel date serial (days since Jan 0, 1900)
function toExcelSerial(date: Date): number {
  const utcMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return (utcMs - Date.UTC(1899, 11, 30)) / 86400000
}

// Replace a self-closing empty cell with a numeric value
// e.g. <c r="B11" s="6"/> → <c r="B11" s="6"><v>12345</v></c>
function setCellNum(xml: string, ref: string, value: number): string {
  // Match self-closing cell tag
  const selfClose = new RegExp(`(<c r="${ref}"[^>]*?)/>`)
  if (selfClose.test(xml)) {
    return xml.replace(selfClose, `$1><v>${value}</v></c>`)
  }
  const withContent = new RegExp(`(<c r="${ref}"[^>]*>)[\\s\\S]*?<\\/c>`)
  return xml.replace(withContent, `$1<v>${value}</v></c>`)
}

// Set a cell to contain an Excel formula with a pre-computed cached value
function setCellFormula(xml: string, ref: string, formula: string, cachedValue: number = 0): string {
  const vTag = `<v>${cachedValue}</v>`
  // Match any cell tag (self-closing or with content)
  const selfClose = new RegExp(`(<c r="${ref}"[^>]*?)/>`)
  if (selfClose.test(xml)) {
    return xml.replace(selfClose, `$1><f>${formula}</f>${vTag}</c>`)
  }
  const withContent = new RegExp(`(<c r="${ref}"[^>]*>)[\\s\\S]*?<\\/c>`)
  return xml.replace(withContent, `$1<f>${formula}</f>${vTag}</c>`)
}

// Set a text cell using inline string (avoids modifying sharedStrings.xml)
function setCellText(xml: string, ref: string, value: string): string {
  const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const selfClose = new RegExp(`(<c r="${ref}"[^>]*?)/>`)
  if (selfClose.test(xml)) {
    return xml.replace(selfClose, `$1 t="inlineStr"><is><t>${escaped}</t></is></c>`)
  }
  // Replace type= attribute if present, then set inlineStr value
  const withType = new RegExp(`(<c r="${ref}"[^>]*?)( t="[^"]*")([^>]*>).*?<\\/c>`)
  if (withType.test(xml)) {
    return xml.replace(withType, `$1 t="inlineStr"$3<is><t>${escaped}</t></is></c>`)
  }
  const withContent = new RegExp(`(<c r="${ref}"[^>]*>).*?<\\/c>`)
  return xml.replace(withContent, `$1<is><t>${escaped}</t></is></c>`)
}

export async function exportMonthToExcel(
  allEntries: KmEntry[],
  year: number,
  month: number,
  settings: AppSettings
): Promise<void> {
  const res = await fetch(import.meta.env.BASE_URL + 'template.xlsx')
  const buf = new Uint8Array(await res.arrayBuffer())
  const files = unzipSync(buf)

  let xml = new TextDecoder().decode(files['xl/worksheets/sheet1.xml'])

  const monthName = getDutchMonthName(month)
  const cap = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  // Header fields (D1:G1, D2:G2, D3:G3 merged — only set first cell of each merge)
  xml = setCellText(xml, 'D1', settings.werknemer || '')
  xml = setCellText(xml, 'D2', settings.klant || '')
  xml = setCellText(xml, 'D3', `${cap} ${year}`)

  // Data rows — emit one row per filled day, sorted chronologically.
  // Includes weekends so weekend trips aren't silently dropped.
  const includedEntries = selectEntriesForExport(allEntries, MAX_ROWS)
  if (allEntries.length > MAX_ROWS) {
    console.warn(
      `Excel template heeft ${MAX_ROWS} rijen; ${allEntries.length - MAX_ROWS} dag(en) worden weggelaten.`,
    )
  }

  let totalF = 0
  let totalG = 0
  for (let i = 0; i < MAX_ROWS; i++) {
    const row = 11 + i
    const entry = includedEntries[i]
    const r = entry?.readings

    if (entry) xml = setCellNum(xml, `A${row}`, toExcelSerial(parseDateKey(entry.date)))
    if (r?.leaveHome != null)         xml = setCellNum(xml, `B${row}`, r.leaveHome)
    if (r?.arriveFirstClient != null) xml = setCellNum(xml, `C${row}`, r.arriveFirstClient)
    if (r?.arriveLastClient != null)  xml = setCellNum(xml, `D${row}`, r.arriveLastClient)
    if (r?.arriveHome != null)        xml = setCellNum(xml, `E${row}`, r.arriveHome)

    // Pre-compute cached values so iOS Files previewer shows correct numbers
    const km = r ? calculateKm(r) : { totaal: null, beroepsmatig: null }
    const fVal = km.totaal ?? 0
    const gVal = km.beroepsmatig ?? 0
    totalF += fVal
    totalG += gVal
    xml = setCellFormula(xml, `F${row}`, `E${row}-B${row}`, fVal)
    xml = setCellFormula(xml, `G${row}`, `D${row}-C${row}`, gVal)
  }

  // Totals row with pre-computed sums
  xml = setCellFormula(xml, 'F40', 'SUM(F11:F39)', totalF)
  xml = setCellFormula(xml, 'G40', 'SUM(G11:G39)', totalG)

  // Write patched XML back into the zip
  files['xl/worksheets/sheet1.xml'] = strToU8(xml)

  // Remove calcChain.xml and its references so Excel rebuilds from the new formulas
  delete files['xl/calcChain.xml']

  let ctXml = new TextDecoder().decode(files['[Content_Types].xml'])
  ctXml = ctXml.replace(/<Override[^>]*calcChain[^>]*\/>/, '')
  files['[Content_Types].xml'] = strToU8(ctXml)

  let relsXml = new TextDecoder().decode(files['xl/_rels/workbook.xml.rels'])
  relsXml = relsXml.replace(/<Relationship[^>]*calcChain[^>]*\/>/, '')
  files['xl/_rels/workbook.xml.rels'] = strToU8(relsXml)

  // Patch workbook.xml to rename the sheet and force recalculation on open
  const newName = `Km ${cap} ${year}`
  let wbXml = new TextDecoder().decode(files['xl/workbook.xml'])
  wbXml = wbXml.replace(/name="Sheet2"/, `name="${newName}"`)
  wbXml = wbXml.replace(/<calcPr[^>]*\/>/, '<calcPr fullCalcOnLoad="1"/>')
  files['xl/workbook.xml'] = strToU8(wbXml)

  // Re-zip (level 0 = store only, fastest; styles/images preserved as-is)
  const zipped = zipSync(files, { level: 0 })

  const filename = `km_${year}_${String(month).padStart(2, '0')}.xlsx`
  const type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  const blob = new Blob([zipped.buffer as ArrayBuffer], { type })

  // iOS Safari: use Web Share API to open the native share sheet
  const file = new File([blob], filename, { type })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: filename })
    return
  }

  // Desktop fallback: trigger download via <a> click
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
