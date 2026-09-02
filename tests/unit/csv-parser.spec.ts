import { describe, it, expect } from 'vitest'
import { parseCsvTarif } from '../../src/domain/csv-parser'
import type { TarifGolongan } from '../../src/domain/types'

const HDR =
  'golongan,deskripsi,default_cc,kartu_dana,tarif_pokok,tarif_denda_maksimal,konstanta_denda_triwulan,konstanta_pokok_perbulan\n'

const DATA = [
  'A,"Kendaraan Khusus (Ambulance, Damkar, dsb)",2499,3000,0,0,0,0',
  'B,"Alat Berat (Exavator, Crane, dsb)",2499,3000,20000,20000,0.25,0.083333333',
  'C1,Sepeda Motor Roda 2 / Roda 3,150,3000,32000,32000,0.25,0.083333333',
  'C2,Sepeda Motor Sport > 250cc,255,3000,80000,80000,0.25,0.083333333',
  'DP,"Minibus, Jeep, Sedan, Pickup Ang. Barang",1500,3000,140000,100000,0.25,0.083333333',
  'DU,Minibus Angkutan Umum sd. 1600cc,1500,3000,70000,70000,0.25,0.083333333',
  'EP,Bus dan Microbus Bukan Ang. Umum,3000,3000,150000,100000,0.25,0.083333333',
  'EU,"Bus / Microbus Angkutan Umum, Minibus Ang. Umum > 1600cc",3000,3000,87000,87000,0.25,0.083333333',
  'F,Truck / Ang. Barang > 2400cc,2499,3000,160000,100000,0.25,0.083333333'
].join('\n')

const VALID_9 = HDR + DATA + '\n'

function expectValid(rows: TarifGolongan[]) {
  expect(rows).toHaveLength(9)
  expect(rows[0]).toMatchObject({ golongan: 'A', deskripsi: 'Kendaraan Khusus (Ambulance, Damkar, dsb)', defaultCc: 2499, kartuDana: 3000, tarifPokok: 0, tarifDendaMaksimal: 0, konstantaDendaTriwulan: 0, konstantaPokokPerbulan: 0 })
  expect(rows[1]).toMatchObject({ golongan: 'B', tarifPokok: 20000, tarifDendaMaksimal: 20000 })
  expect(rows[2]).toMatchObject({ golongan: 'C1', deskripsi: 'Sepeda Motor Roda 2 / Roda 3', defaultCc: 150, tarifPokok: 32000, tarifDendaMaksimal: 32000 })
  expect(rows[3]).toMatchObject({ golongan: 'C2', defaultCc: 255, tarifPokok: 80000 })
  expect(rows[4]).toMatchObject({ golongan: 'DP', deskripsi: 'Minibus, Jeep, Sedan, Pickup Ang. Barang', defaultCc: 1500, tarifPokok: 140000, tarifDendaMaksimal: 100000 })
  expect(rows[5]).toMatchObject({ golongan: 'DU', tarifPokok: 70000 })
  expect(rows[6]).toMatchObject({ golongan: 'EP', defaultCc: 3000, tarifPokok: 150000, tarifDendaMaksimal: 100000 })
  expect(rows[7]).toMatchObject({ golongan: 'EU', deskripsi: 'Bus / Microbus Angkutan Umum, Minibus Ang. Umum > 1600cc', defaultCc: 3000, tarifPokok: 87000 })
  expect(rows[8]).toMatchObject({ golongan: 'F', defaultCc: 2499, tarifPokok: 160000, tarifDendaMaksimal: 100000 })
  // konstanta non-A = 0.25 / 0.083333333; uang integer
  for (const r of rows.filter((r) => r.golongan !== 'A')) {
    expect(r.konstantaDendaTriwulan).toBeGreaterThan(0)
    expect(r.konstantaPokokPerbulan).toBeGreaterThan(0)
  }
}

describe('csv-parser fail-closed (contracts/csv-tarif.md §5)', () => {
  it('happy path: 9 baris valid → TarifGolongan[] lengkap, deskripsi berkoma utuh, angka benar', () => {
    expectValid(parseCsvTarif(VALID_9))
  })

  it('header salah urutan → reject', () => {
    const wrong = 'deskripsi,golongan,default_cc,kartu_dana,tarif_pokok,tarif_denda_maksimal,konstanta_denda_triwulan,konstanta_pokok_perbulan\n' + DATA + '\n'
    expect(() => parseCsvTarif(wrong)).toThrow()
  })

  it('header salah eja / kolom kurang-lebih → reject', () => {
    expect(() => parseCsvTarif('golongan,deskripsi,default_cc\n')).toThrow()
    expect(() => parseCsvTarif(HDR.replace('golongan', 'golongn') + DATA + '\n')).toThrow()
  })

  it('golongan duplikat → reject', () => {
    const dup = HDR + DATA.split('\n')[0] + '\n' + DATA + '\n'
    expect(() => parseCsvTarif(dup)).toThrow()
  })

  it('golongan hilang / baris ≠ 9 → reject', () => {
    const missing = HDR + DATA.split('\n').slice(0, 5).join('\n') + '\n'
    expect(() => parseCsvTarif(missing)).toThrow()
  })

  it('golongan tak dikenal → reject', () => {
    const unknown = HDR + DATA.replace('C1,Sepeda Motor Roda 2 / Roda 3,150', 'Z9,Hantu,150') + '\n'
    expect(() => parseCsvTarif(unknown)).toThrow()
  })

  it('uang negatif → reject', () => {
    expect(() => parseCsvTarif(HDR + DATA.replace('B,"Alat Berat (Exavator, Crane, dsb)",2499,3000,20000,20000', 'B,"Alat Berat (Exavator, Crane, dsb)",2499,3000,-20000,20000') + '\n')).toThrow()
  })

  it('uang desimal / kosong / non-numerik → reject', () => {
    const dec = DATA.replace(',20000,0.25', ',20000.5,0.25')
    expect(() => parseCsvTarif(HDR + dec + '\n')).toThrow()
    const empty = DATA.replace(',32000,32000', ',32000,')
    expect(() => parseCsvTarif(HDR + empty + '\n')).toThrow()
    const nan = DATA.replace('32000,32000', 'xyz,32000')
    expect(() => parseCsvTarif(HDR + nan + '\n')).toThrow()
  })

  it('konstanta < 0 atau > 1 → reject; A konstanta 0 diterima', () => {
    const neg = DATA.replace('C1,Sepeda Motor Roda 2 / Roda 3,150,3000,32000,32000,0.25,0.083333333', 'C1,Sepeda Motor Roda 2 / Roda 3,150,3000,32000,32000,-0.1,0.083333333')
    expect(() => parseCsvTarif(HDR + neg + '\n')).toThrow()
    const over = DATA.replace('B,"Alat Berat (Exavator, Crane, dsb)",2499,3000,20000,20000,0.25,0.083333333', 'B,"Alat Berat (Exavator, Crane, dsb)",2499,3000,20000,20000,1.1,0.083333333')
    expect(() => parseCsvTarif(HDR + over + '\n')).toThrow()
    // A non-A konstanta 0 → reject
    const c1zero = DATA.replace('C1,Sepeda Motor Roda 2 / Roda 3,150,3000,32000,32000,0.25,0.083333333', 'C1,Sepeda Motor Roda 2 / Roda 3,150,3000,32000,32000,0,0.083333333')
    expect(() => parseCsvTarif(HDR + c1zero + '\n')).toThrow()
  })

  it('file kosong / hanya header → reject', () => {
    expect(() => parseCsvTarif('')).toThrow()
    expect(() => parseCsvTarif(HDR)).toThrow()
  })

  it('CRLF diterima', () => {
    const crlf = HDR.replace(/\n/g, '\r\n') + DATA.replace(/\n/g, '\r\n') + '\r\n'
    expectValid(parseCsvTarif(crlf))
  })

  it('BOM di awal file → reject', () => {
    expect(() => parseCsvTarif('\uFEFF' + VALID_9)).toThrow()
  })
})