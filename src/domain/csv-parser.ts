// Parser + validasi ketat fail-closed — contracts/csv-tarif.md §4–§5. Tolak seluruh file bila satu pelanggaran.
import type { Golongan, TarifGolongan } from './types'

const HEADER = 'golongan,deskripsi,default_cc,kartu_dana,tarif_pokok,tarif_denda_maksimal,konstanta_denda_triwulan,konstanta_pokok_perbulan'
const GOLONGAN_VALID: ReadonlySet<Golongan> = new Set<Golongan>(['A', 'B', 'C1', 'C2', 'DP', 'DU', 'EP', 'EU', 'F'])
const ANGKA = /^\d+$/
const DESIMAL = /^\d+(\.\d+)?$/
const LABEL_KONSTANTA = ['', '', '', '', '', '', 'konstanta_denda_triwulan', 'konstanta_pokok_perbulan'] as const

class CsvError extends Error {}

/** Parser 1 baris CSV RFC 4180: koma di dalam tanda kutip tidak memecah field. */
class CsvRow {
  private readonly fields: string[] = []
  private cur = ''
  private inQuote = false
  private pos = 0

  constructor(private readonly chars: string[]) {}

  parse(): string[] {
    while (this.pos < this.chars.length) this.step()
    if (this.inQuote) throw new CsvError('kutip tidak tertutup')
    this.fields.push(this.cur)
    return this.fields
  }

  private step(): void {
    const c = this.chars[this.pos]
    if (c === '"') this.stepQuote()
    else if (!this.inQuote && c === ',') this.pushField()
    else this.cur += c
    this.pos++
  }

  private stepQuote(): void {
    if (!this.inQuote) {
      if (this.cur.length > 0) throw new CsvError('kutip di tengah field')
      this.inQuote = true
    } else if (this.chars[this.pos + 1] === '"') {
      this.cur += '"'
      this.pos++
    } else {
      this.inQuote = false
    }
  }

  private pushField(): void {
    this.fields.push(this.cur)
    this.cur = ''
  }
}

/** Validasi + konversi 8 kolom → record tarif. */
class TarifRow {
  constructor(
    private readonly f: string[],
    private readonly seen: ReadonlySet<string>
  ) {
    if (f.length !== 8) throw new CsvError(`jumlah kolom ${f.length} ≠ 8`)
  }

  toRecord(): TarifGolongan {
    return {
      golongan: this.golongan(),
      deskripsi: this.deskripsi(),
      defaultCc: this.defaultCc(),
      kartuDana: this.kartuDana(),
      tarifPokok: this.tarifPokok(),
      tarifDendaMaksimal: this.tarifDendaMaksimal(),
      konstantaDendaTriwulan: this.konstantaDenda(),
      konstantaPokokPerbulan: this.konstantaPokok()
    }
  }

  private golongan(): Golongan {
    const g = this.f[0] as Golongan
    if (!GOLONGAN_VALID.has(g)) throw new CsvError(`golongan tak dikenal: ${g}`)
    if (this.seen.has(g)) throw new CsvError(`golongan duplikat: ${g}`)
    return g
  }

  private deskripsi(): string {
    const d = this.f[1].trim()
    if (!d) throw new CsvError(`deskripsi kosong utk ${this.f[0]}`)
    return d
  }

  private defaultCc(): number {
    if (!ANGKA.test(this.f[2])) throw new CsvError(`default_cc bukan integer ≥ 0: "${this.f[2]}"`)
    const n = Number(this.f[2])
    if (n < 1) throw new CsvError('default_cc wajib ≥ 1')
    return n
  }

  private kartuDana(): number {
    if (!ANGKA.test(this.f[3])) throw new CsvError(`kartu_dana bukan integer ≥ 0: "${this.f[3]}"`)
    return Number(this.f[3])
  }

  private tarifPokok(): number {
    if (!ANGKA.test(this.f[4])) throw new CsvError(`tarif_pokok bukan integer ≥ 0: "${this.f[4]}"`)
    return Number(this.f[4])
  }

  private tarifDendaMaksimal(): number {
    if (!ANGKA.test(this.f[5])) throw new CsvError(`tarif_denda_maksimal bukan integer ≥ 0: "${this.f[5]}"`)
    return Number(this.f[5])
  }

  private konstantaDenda(): number {
    return this.konstanta(6)
  }

  private konstantaPokok(): number {
    return this.konstanta(7)
  }

  private konstanta(i: 6 | 7): number {
    const label = LABEL_KONSTANTA[i]
    const raw = this.f[i]
    if (!DESIMAL.test(raw)) throw new CsvError(`${label} bukan numerik desimal: "${raw}"`)
    const n = Number(raw)
    if (n < 0 || n > 1) throw new CsvError(`${label} di luar [0,1]: ${n}`)
    if (this.f[0] !== 'A' && n <= 0) throw new CsvError(`${label} wajib > 0 utk ${this.f[0]}`)
    return n
  }
}

/** Normalisasi CRLF → LF (CRLF ditoleransi), buang baris kosong akhir, trimEnd tiap baris. */
function splitRows(input: string): string[] {
  const text = input.replaceAll('\r\n', '\n').replaceAll('\r', '\n')
  const lines = text.split('\n')
  while (lines.length && lines.at(-1)?.trim() === '') lines.pop()
  return lines.map((l) => l.trimEnd())
}

/** Struktur file: non-kosong, header PERSIS (urutan & case-sensitive), tepat 9 baris data. */
function assertStruktur(rows: string[]): void {
  if (rows.length === 0) throw new CsvError('file kosong')
  if (rows[0] !== HEADER) throw new CsvError('header tidak sesuai skema')
  assertJumlahData(rows)
}

function assertJumlahData(rows: string[]): void {
  const n = rows.length - 1
  if (n === 0) throw new CsvError('hanya header (tanpa baris data)')
  if (n !== 9) throw new CsvError(`jumlah baris data ${n} ≠ 9`)
}

export function parseCsvTarif(input: string): TarifGolongan[] {
  if (input.codePointAt(0) === 0xfeff) throw new CsvError('BOM tidak diizinkan')
  const rows = splitRows(input)
  assertStruktur(rows)
  const seen = new Set<string>()
  return rows.slice(1).map((row) => {
    if (row.trim() === '') throw new CsvError('baris data kosong')
    const record = new TarifRow(new CsvRow([...row]).parse(), seen).toRecord()
    seen.add(record.golongan)
    return record
  })
}
