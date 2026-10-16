import { expect, test, type Page } from '@playwright/test';
import { crearProveedor, loginYEsperarResumen } from '../helpers';

test.use({ viewport: { width: 390, height: 844 } });

async function sinScrollHorizontal(page: Page): Promise<void> {
  const medidas = await page.evaluate(() => ({
    contenido: document.documentElement.scrollWidth,
    ventana: document.documentElement.clientWidth,
  }));
  expect(medidas.contenido).toBeLessThanOrEqual(medidas.ventana);
}

test.beforeEach(async ({ page }) => {
  await loginYEsperarResumen(page);
});

test('movil: the three tabs fit the screen and the gear opens Configuración', async ({ page }) => {
  const ventana = page.viewportSize()!.width;
  for (const nombre of ['Resumen', 'Recepciones', 'Proveedores']) {
    const caja = await page.getByRole('link', { name: nombre, exact: true }).boundingBox();
    expect(caja).not.toBeNull();
    expect(caja!.x).toBeGreaterThanOrEqual(0);
    expect(caja!.x + caja!.width).toBeLessThanOrEqual(ventana);
  }

  const engranaje = page.getByRole('link', { name: 'Configuración', exact: true });
  await expect(engranaje).toBeVisible();
  await engranaje.click();

  await expect(page.getByRole('heading', { name: 'Configuración', exact: true })).toBeVisible();
  await expect(engranaje).toHaveAttribute('aria-current', 'page');
});

test('movil: the page never scrolls horizontally on Resumen, Recepciones, a proveedor and Configuración', async ({ page }) => {
  await sinScrollHorizontal(page);

  await page.getByRole('link', { name: 'Recepciones', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recepciones', exact: true })).toBeVisible();
  await sinScrollHorizontal(page);

  const nombre = await crearProveedor(page);
  await expect(page.getByRole('heading', { name: nombre })).toBeVisible();
  await sinScrollHorizontal(page);

  await page.getByRole('link', { name: 'Configuración', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Configuración', exact: true })).toBeVisible();
  await sinScrollHorizontal(page);
});
