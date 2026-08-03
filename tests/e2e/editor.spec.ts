import { expect, test } from '@playwright/test'

test('abre o editor e filtra templates sem interromper a criação', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('header').getByText('Rota de Ataque', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Story', exact: true }).click()
  await expect(page.locator('aside').first().getByText('Formato', { exact: true })).toBeVisible()
  await expect(page.locator('aside').first().getByText('Segmento', { exact: true })).toBeVisible()
})

test('as abas existentes continuam navegáveis', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Marca', exact: true }).click()
  await expect(page.getByText('Guia de Identidade Visual')).toBeVisible()
  await page.getByRole('button', { name: 'Criar Arte', exact: true }).click()
  await expect(page.locator('aside').first().getByText('Formato', { exact: true })).toBeVisible()
})
