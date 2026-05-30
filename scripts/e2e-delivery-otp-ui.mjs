/**
 * Playwright UI check: customer /orders expanded OTP visibility.
 * Usage: node scripts/e2e-delivery-otp-ui.mjs <orderId> <demoOtp>
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const orderId = process.argv[2]
const expectedOtp = process.argv[3] || '123456'
const base = process.env.E2E_BASE || 'http://localhost:5199'
const api = `${base}/api/v1`

if (!orderId) {
  console.error('Usage: node e2e-delivery-otp-ui.mjs <orderId> [otp]')
  process.exit(1)
}

async function loginPhone(page, phone) {
  const send = await page.request.post(`${api}/auth/send-otp`, {
    data: { phone },
  })
  const sendJson = await send.json()
  const otp = sendJson.data?.demoOtp
  const verify = await page.request.post(`${api}/auth/verify-otp`, {
    data: { phone, otp },
  })
  const v = await verify.json()
  const token = v.data?.accessToken
  await page.evaluate((t) => localStorage.setItem('carnalysys_access_token', t), token)
  return token
}

const outDir = join(__dirname, 'e2e-screenshots')
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()

await loginPhone(page, '9004027637')
await page.goto(`${base}/orders?focusOrder=${encodeURIComponent(orderId)}`, { waitUntil: 'networkidle' })

// Wait for delivery-otp fetch
const otpResponse = await page.waitForResponse(
  (r) => r.url().includes(`/orders/${orderId}/delivery-otp`) && r.status() === 200,
  { timeout: 20000 },
).catch(() => null)

let networkOtp = null
if (otpResponse) {
  const body = await otpResponse.json()
  networkOtp = body?.data?.deliveryOtp
}

// Expand order if needed
const row = page.locator(`#order-${orderId}`)
await row.waitFor({ state: 'visible', timeout: 15000 })
const expandBtn = row.locator('button').first()
if ((await expandBtn.getAttribute('aria-expanded')) !== 'true') {
  await expandBtn.click()
  await page.waitForTimeout(1500)
}

const otpText = page.getByText('Your delivery OTP')
await otpText.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null)
const codeEl = page.locator('.font-display.text-4xl')
const visibleCode = (await codeEl.textContent().catch(() => ''))?.replace(/\s/g, '') || ''

await page.screenshot({ path: join(outDir, '01-orders-otp-before-verify.png'), fullPage: true })

const verifiedMsg = page.getByText('Delivery OTP verified.')
const hasVerified = await verifiedMsg.isVisible().catch(() => false)

const result = {
  orderId,
  networkDeliveryOtp: networkOtp,
  visibleOtpCode: visibleCode,
  otpHeadingVisible: await otpText.isVisible().catch(() => false),
  passBeforeVerify:
    networkOtp === expectedOtp && visibleCode === expectedOtp && (await otpText.isVisible()),
}

console.log(JSON.stringify(result, null, 2))
await browser.close()
process.exit(result.passBeforeVerify ? 0 : 1)
