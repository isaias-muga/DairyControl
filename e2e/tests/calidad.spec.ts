import { expect, test, type Page } from '@playwright/test';
import {
  crearProveedor,
  guardarLimites,
  loginYEsperarResumen,
  registrarRecepcion,
  rellenar,
  restaurarAcidezMaxima,
} from '../helpers';

// The limits row is global: the tests that change it always restore the default (restaurarAcidezMaxima).

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
  await expect(page.getByText('1 de 1 recepciones')).toBeVisible();

  expect(await fueraDeRangoEn(page, nombre)).toBe('1');
});

// demoraMs > 0 holds the save request back, like a slow connection: Resumen must still see the new limit.
for (const demoraMs of [0, 500]) {
  const titulo = 'calidad: changing a limit in Configuración changes what is flagged';
  test(demoraMs ? `${titulo} (slow save)` : titulo, async ({ page, request }) => {
    if (demoraMs) {
      await page.route('**/api/Configuracion/calidad', async (route) => {
        if (route.request().method() === 'PUT') {
          await new Promise((resolve) => setTimeout(resolve, demoraMs));
        }
        await route.continue();
      });
    }
    const nombre = await crearProveedor(page);
    await registrarRecepcion(page, { litros: 1000, acidez: 22, temperatura: 5 });
    await expect(page.getByText('1 de 1 recepciones')).toBeVisible();
    expect(await fueraDeRangoEn(page, nombre)).toBe('1');

    await page.getByRole('link', { name: 'Configuración' }).click();
    await expect(page.getByLabel(/^Acidez máxima/)).toBeVisible();

    try {
      await rellenar(page.getByLabel(/^Acidez máxima/), '25');
      await guardarLimites(page);

      expect(await fueraDeRangoEn(page, nombre)).toBe('0');
    } finally {
      // Always restore the documented default through the API: it works even after a timeout or a closed page.
      await restaurarAcidezMaxima(request);
    }
  });
}

test('calidad: a limit typed as "19,5" is saved as 19.5 and shown as 19,5 after reloading', async ({ page, request }) => {
  await page.getByRole('link', { name: 'Configuración' }).click();
  await expect(page.getByLabel(/^Acidez máxima/)).toBeVisible();

  try {
    await rellenar(page.getByLabel(/^Acidez máxima/), '19,5');
    await guardarLimites(page);

    await page.reload();
    await expect(page.getByLabel(/^Acidez máxima/)).toHaveValue('19,5');
  } finally {
    await restaurarAcidezMaxima(request);
  }
});
