import { expect, test, type Page } from '@playwright/test';
import { crearProveedor, loginYEsperarResumen, registrarRecepcion, rellenar } from '../helpers';

// The limits row is global: the second test changes it and always restores it.

async function fueraDeRangoEn(page: Page, nombre: string): Promise<string> {
  await page.getByRole('link', { name: 'Resumen' }).click();
  const fila = page.getByRole('row', { name: new RegExp(nombre) });
  await expect(fila).toBeVisible();
  return (await fila.getByRole('cell').last().innerText()).trim();
}

test.beforeEach(async ({ page }) => {
  await loginYEsperarResumen(page);
});

test('calidad: a value outside the limits is saved and flagged as out of range', async ({ page }) => {
  const nombre = await crearProveedor(page);

  // Acidity 25 is plausible (10-30) but above the default maximum of 19.
  await registrarRecepcion(page, { litros: 1000, acidez: 25, temperatura: 5 });
  await expect(page.getByRole('heading', { name: 'Recepciones (1)' })).toBeVisible();

  expect(await fueraDeRangoEn(page, nombre)).toBe('1');
});

test('calidad: changing a limit in Configuración changes what is flagged', async ({ page }) => {
  const nombre = await crearProveedor(page);
  await registrarRecepcion(page, { litros: 1000, acidez: 22, temperatura: 5 });
  await expect(page.getByRole('heading', { name: 'Recepciones (1)' })).toBeVisible();
  expect(await fueraDeRangoEn(page, nombre)).toBe('1');

  await page.getByRole('link', { name: 'Configuración' }).click();
  const acidezMaxima = page.getByLabel(/^Acidez máxima/);
  await expect(acidezMaxima).toBeVisible();
  const original = await acidezMaxima.inputValue();

  try {
    await rellenar(acidezMaxima, '25');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Última modificación')).toBeVisible();

    expect(await fueraDeRangoEn(page, nombre)).toBe('0');
  } finally {
    await page.getByRole('link', { name: 'Configuración' }).click();
    await rellenar(page.getByLabel(/^Acidez máxima/), original);
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByLabel(/^Acidez máxima/)).toHaveValue(original);
  }
});
