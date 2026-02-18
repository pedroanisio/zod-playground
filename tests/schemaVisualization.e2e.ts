import {expect, type Page} from '@playwright/test'
import {MERMAID_CDN_URL, ZOD_MERMAID_CDN_URL} from '../src/features/SchemaVisualization/cdn'
import * as zod from '../src/zod'
import {test} from './fixtures'

async function mockVisualizationCdn(page: Page, {failLoad = false}: {failLoad?: boolean} = {}) {
  await page.route(ZOD_MERMAID_CDN_URL, async (route) => {
    if (failLoad) {
      await route.fulfill({
        status: 500,
        contentType: 'application/javascript',
        body: 'throw new Error("CDN load failed")',
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
export function generateMermaidDiagram(_schema, options = {}) {
  const type = options.diagramType ?? 'er'
  return 'graph TD; A[' + type + '] --> B[schema]'
}
`,
    })
  })

  await page.route(MERMAID_CDN_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
let theme = 'default'
export default {
  initialize(config = {}) {
    theme = config.theme ?? 'default'
  },
  async render(id, text) {
    return {
      svg: '<svg data-id="' + id + '" data-theme="' + theme + '"><text>' + text + '</text></svg>'
    }
  }
}
`,
    })
  })
}

test('renders ER diagram on Diagram tab', async ({page}) => {
  await mockVisualizationCdn(page)

  await page.getByRole('tab', {name: 'Diagram'}).click()

  await expect(page.getByRole('img', {name: 'ER diagram of schema'})).toBeVisible()
  await expect(page.locator('svg[data-theme="default"]')).toBeVisible()
  await expect(page.getByRole('button', {name: 'Copy Mermaid'})).toBeEnabled()
})

test('switching diagram type updates rendered diagram', async ({page}) => {
  await mockVisualizationCdn(page)

  await page.getByRole('tab', {name: 'Diagram'}).click()
  await page.getByRole('radio', {name: 'Class'}).click()

  await expect(page.getByRole('img', {name: 'Class diagram of schema'})).toBeVisible()
  await expect(page.locator('svg text')).toContainText('class')
})

test('switching color scheme re-renders diagram theme', async ({page}) => {
  await mockVisualizationCdn(page)

  await page.getByRole('tab', {name: 'Diagram'}).click()
  await expect(page.locator('svg')).toBeVisible()

  const initialTheme = await page.locator('svg').first().getAttribute('data-theme')

  await page.getByLabel('Toggle color scheme').click()

  await expect
    .poll(async () => page.locator('svg').first().getAttribute('data-theme'))
    .not.toBe(initialTheme)
})

test('shows load error when CDN import fails', async ({page}) => {
  await mockVisualizationCdn(page, {failLoad: true})

  await page.getByRole('tab', {name: 'Diagram'}).click()

  await expect(
    page.getByText('Diagram unavailable - could not load visualization libraries.'),
  ).toBeVisible()
})

test('Values tab still validates after opening Diagram tab', async ({page, codeEditors}) => {
  await mockVisualizationCdn(page)

  await page.getByRole('tab', {name: 'Diagram'}).click()
  await expect(page.locator('svg')).toBeVisible()

  await page.getByRole('tab', {name: 'Values'}).click()

  await codeEditors.writeValue({text: '{}'})
  await expect(page.locator('div').filter({hasText: /^Invalid$/})).toBeVisible()

  await codeEditors.writeValue({text: '{name: "John"}'})
  await expect(page.locator('div').filter({hasText: /^Valid$/})).toBeVisible()
})

test('disables Diagram tab on Zod 3.x versions', async ({page}) => {
  const zod3Version = (await zod.getVersions()).find((entry) => entry.version.startsWith('3.'))
  test.skip(!zod3Version, 'No Zod 3.x version available')
  if (!zod3Version) return

  await page.getByRole('button', {name: /zod v/i}).click()
  await page.getByRole('option', {name: zod3Version.version}).click()

  await expect(page.getByRole('tab', {name: 'Diagram'})).toBeDisabled()
})
