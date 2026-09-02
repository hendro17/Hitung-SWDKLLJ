// Parser + validasi ketat fail-closed — contracts/csv-tarif.md §4–§5. Tolak seluruh file bila satu pelanggaran.
import type { Golongan, TarifGolongan } from './types'

const HEADER = 'golongan,deskripsi,default_cc,kartu_dana,tarif_pokok,tarif_denda_maksimal,konstanta_denda_triwulan,konstanta_pokok_perbulan'

const GOLONGAN_VALID: readonly Golongan[] = ['A', 'B', 'C1', 'C2', 'DP', 'DU', 'EP', 'EU', 'F']

class CsvError extends Error {}

/** Split 1 baris CSV RFC 4180: koma di dalam tanda kutip tidak memecah field. */
function splitRow(line: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuote) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuote = false
        }
      } else {
        cur += c
      }
    } else if (c === '"') {
      if (cur.length === 0) inQuote = true
      else throw new CsvError('kutip di tengah field')
    } else if (c === ',') {
      fields.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  if (inQuote) throw new CsvError('kutip tidak tertutup')
  fields.push(cur)
  return fields
}

function assertUang(v: string, label: string): number {
  if (!/^\d+$/.test(v)) throw new CsvError(`${label} bukan integer ≥ 0: "${v}"`)
  return Number(v)
}

function assertKonstanta(v: string, label: string): number {
  if (!/^\d+(\.\d+)?$/.test(v)) throw new CsvError(`${label} bukan numerik desimal: "${v}"`)
  const n = Number(v)
  if (n < 0 || n > 1) throw new CsvError(`${label} di luar [0,1]: ${n}`)
  return n
}

export function parseCsvTarif(input: string): TarifGolongan[] {
  if (input.charCodeAt(0) === 0xfeff) throw new CsvError('BOM tidak diizinkan')

  // Normalisasi CRLF → LF (CRLF ditoleransi)
  const text = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = text.split('\n')
  // buang baris kosong akhir
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
  const rows = lines.map((l) => l.trimEnd())

  if (rows.length === 0) throw new CsvError('file kosong')

  // Header PERSIS (urutan & case-sensitive)
  const header = rows[0]
  if (header !== HEADER) throw new CsvError('header tidak sesuai skema')

  const dataRows = rows.slice(1)
  if (dataRows.length === 0) throw new CsvError('hanya header (tanpa baris data)')
  if (dataRows.length !== 9) throw new CsvError(`jumlah baris data ${dataRows.length} ≠ 9`)

  const seen = new Set<string>()
  const records: TarifGolongan[] = []

  for (const row of dataRows) {
    if (row.trim() === '') throw new CsvError('baris data kosong')
    const f = splitRow(row)
    if (f.length !== 8) throw new CsvError(`jumlah kolom ${f.length} ≠ 8`)

    const golongan = f[0] as Golongan
    if (!GOLONGAN_VALID.includes(golongan)) throw new CsvError(`golongan tak dikenal: ${golongan}`)
    if (seen.has(golongan)) throw new CsvError(`golongan duplikat: ${golongan}`)
    seen.add(golongan)

    const deskripsi = f[1].trim()
    if (!deskripsi) throw new CsvError(`deskripsi kosong utk ${golongan}`)

    const defaultCc = assertUang(f[2], 'default_cc')
    if (defaultCc < 1) throw new CsvError('default_cc wajib ≥ 1')

    const kartuDana = assertUang(f[3], 'kartu_dana')
    const tarifPokok = assertUang(f[4], 'tarif_pokok')
    const tarifDendaMaksimal = assertUang(f[5], 'tarif_denda_maksimal')
    const konstantaDendaTriwulan = assertKonstanta(f[6], 'konstanta_denda_triwulan')
    const konstantaPokokPerbulan = assertKonstanta(f[7], 'konstanta_pokok_perbulan')

    if (golongan !== 'A') {
      if (konstantaDendaTriwulan <= 0) throw new CsvError(`konstanta denda wajib > 0 utk ${golongan}`)
      if (konstantaPokokPerbulan <= 0) throw new CsvError(`konstanta pokok wajib > 0 utk ${golongan}`)
    }

    records.push({
      golongan,
      deskripsi,
      defaultCc,
      kartuDana,
      tarifPokok,
      tarifDendaMaksimal,
      konstantaDendaTriwulan: konstantaDendaTriwulan,
      konstantaPokokPerbulan: konstantaPokokPerbulan
    })
  }

  return records
}