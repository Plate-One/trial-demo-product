import { chromium } from 'playwright'

const browser = await chromium.launch({
  executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
})
const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 2,
})
const page = await context.newPage()

await page.goto('http://localhost:8080', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

await page.screenshot({ path: '/home/user/trial-demo-product/mobile/screenshot-login.png', fullPage: false })
console.log('Login screenshot saved')

await browser.close()
