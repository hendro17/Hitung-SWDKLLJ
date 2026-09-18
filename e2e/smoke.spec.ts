import { expect, test } from '@playwright/test'

async function keLangkahData(page) {
  await page.goto('/')
  await expect(page).toHaveTitle(/Hitung SWDKLLJ/)
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: /Perpanjangan/i }).click()
  await page.getByRole('button', { name: /Lanjutkan/i }).click()
  await expect(page.getByTestId('card-data')).toBeVisible()
}

test('wizard transaksi -> data kendaraan', async ({ page }) => {
  await keLangkahData(page)
  await expect(page.getByRole('heading', { name: 'Data Kendaraan' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Hitung Premi SWDKLLJ/i })).toBeVisible()
})

test('PWA artifacts wired: manifest + service worker', async ({ page }) => {
  await page.goto('/')
  const manifestHref = await page.getAttribute('link[rel="manifest"]', 'href')
  expect(manifestHref).toBeTruthy()
  const manifestRes = await page.request.get(new URL(manifestHref!, page.url()).toString())
  expect(manifestRes.ok()).toBeTruthy()
  const manifest = await manifestRes.json()
  expect(manifest.name ?? manifest.short_name).toBeTruthy()
  expect(manifest.icons?.length).toBeGreaterThan(0)

  const swSupported = await page.evaluate(() => 'serviceWorker' in navigator)
  expect(swSupported).toBeTruthy()
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, {
    timeout: 15_000,
  })
  const swRes = await page.request.get('/sw.js')
  expect(swRes.ok()).toBeTruthy()
})

test('offline reload still renders shell (precache)', async ({ page, context, browserName }) => {
  await keLangkahData(page)
  if (browserName === 'webkit') {
    // Playwright WebKit aborts offline navigation as internal error before SW
    // can serve, so verify precache contents directly via Cache Storage API.
    const precache = await page.evaluate(async () => {
      const keys = await caches.keys()
      const out: Record<string, string[]> = {}
      for (const k of keys) {
        const c = await caches.open(k)
        out[k] = (await c.keys()).map((r) => new URL(r.url).pathname)
      }
      return out
    })
    const all = Object.values(precache).flat()
    expect(all.some((p) => p === '/' || p.endsWith('index.html'))).toBeTruthy()
    expect(all.length).toBeGreaterThan(5)
    return
  }
  await context.setOffline(true)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Hitung SWDKLLJ').first()).toBeVisible({ timeout: 15_000 })
  await context.setOffline(false)
})
