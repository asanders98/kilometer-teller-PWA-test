import { unzipSync, strToU8, zipSync } from 'fflate'
import type { KmEntry, AppSettings } from '../types'
import { getDutchMonthName, formatDateKey } from './dateUtils'

// Convert a JS Date to Excel date serial (days since Jan 0, 1900)
function toExcelSerial(date: Date): number {
  const utcMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return (utcMs - Date.UTC(1899, 11, 30)) / 86400000
}

function getWorkdays(year: number, month: number): Date[] {
  const days: Date[] = []
  const last = new Date(year, month, 0).getDate()
  for (let d = 1; d <= last; d++) {
    const date = new Date(year, month - 1, d)
    const dow = date.getDay()
    if (dow !== 0 && dow !== 6) days.push(date)
  }
  return days
}

// Replace a self-closing empty cell with a numeric value
// e.g. <c r="B11" s="6"/> → <c r="B11" s="6"><v>12345</v></c>
function setCellNum(xml: string, ref: string, value: number): string {
  // Match self-closing cell tag
  const selfClose = new RegExp(`(<c r="${ref}"[^>]*?)/>`)
  if (selfClose.test(xml)) {
    return xml.replace(selfClose, `$1><v>${value}</v></c>`)
  }
  // Match cell with existing content (e.g. <c r="F11" ...><f.../><v>0</v></c>)
  const withContent = new RegExp(`(<c r="${ref}"[^>]*>)(<[^>]+>)*<v>[^<]*<\\/v>(<[^>]+>)*(<\\/c>)`)
  return xml.replace(withContent, `$1<v>${value}</v></c>`)
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
  const res = await fetch('/template.xlsx')
  const buf = new Uint8Array(await res.arrayBuffer())
  const files = unzipSync(buf)

  let xml = new TextDecoder().decode(files['xl/worksheets/sheet1.xml'])

  const monthName = getDutchMonthName(month)
  const cap = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  // Header fields (D1:G1, D2:G2, D3:G3 merged — only set first cell of each merge)
  xml = setCellText(xml, 'D1', settings.werknemer || '')
  xml = setCellText(xml, 'D2', settings.klant || '')
  xml = setCellText(xml, 'D3', `${cap} ${year}`)

  // Data rows — fill only rows for actual workdays, leave the rest empty
  const entryMap = new Map(allEntries.map((e) => [e.date, e]))
  const workdays = getWorkdays(year, month)

  for (let i = 0; i < Math.min(workdays.length, 29); i++) {
    const day = workdays[i]!
    const row = 11 + i
    const r = entryMap.get(formatDateKey(day))?.readings

    xml = setCellNum(xml, `A${row}`, toExcelSerial(day))

    if (r?.leaveHome != null)        xml = setCellNum(xml, `B${row}`, r.leaveHome)
    if (r?.arriveFirstClient != null) xml = setCellNum(xml, `C${row}`, r.arriveFirstClient)
    if (r?.arriveLastClient != null)  xml = setCellNum(xml, `D${row}`, r.arriveLastClient)
    if (r?.arriveHome != null)        xml = setCellNum(xml, `E${row}`, r.arriveHome)
    // F and G already have shared formulas from template — no change needed
  }

  // Write patched XML back into the zip
  files['xl/worksheets/sheet1.xml'] = strToU8(xml)

  // Patch workbook.xml to rename the sheet
  const newName = `Km ${cap} ${year}`
  let wbXml = new TextDecoder().decode(files['xl/workbook.xml'])
  wbXml = wbXml.replace(/name="Sheet2"/, `name="${newName}"`)
  files['xl/workbook.xml'] = strToU8(wbXml)

  // Re-zip (level 0 = store only, fastest; styles/images preserved as-is)
  const zipped = zipSync(files, { level: 0 })

  const blob = new Blob([zipped.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `km_${year}_${String(month).padStart(2, '0')}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
