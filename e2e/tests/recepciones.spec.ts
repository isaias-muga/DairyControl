import { expect, test } from '@playwright/test';
import { abrirRegistro, crearProveedor, descartarRegistro, loginYEsperarResumen, registrarRecepcion, rellenar, ticketUnico } from '../helpers';

test.beforeEach(async ({ page }) => {
  await loginYEsperarResumen(page);
});

test('recepción: a valid one is saved and listed with its ticket', async ({ page }) => {
  await crearProveedor(page);
  const ticket = ticketUnico();

  await registrarRecepcion(page, { litros: 1500, acidez: 16, temperatura: 5, ticket });

  await expect(page.getByRole('cell', { name: String(ticket), exact: true })).toBeVisible();
  await expect(page.getByText('1 de 1 recepciones')).toBeVisible();
});

test('recepción: an impossible value shows its message and is not saved', async ({ page }) => {
  await crearProveedor(page);

  await registrarRecepcion(page, { litros: 1500, acidez: 5, temperatura: 5 });

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Requerido, entre 10 y 30 °D.')).toBeVisible();
  await descartarRegistro(page);
  await expect(page.getByText('No hay recepciones con estos filtros.')).toBeVisible();
});

test('recepción: a duplicate ticket shows its message and is not saved', async ({ page }) => {
  const ticket = ticketUnico();
  await crearProveedor(page);
  await registrarRecepcion(page, { litros: 1000, acidez: 16, temperatura: 5, ticket });
  await expect(page.getByRole('cell', { name: String(ticket), exact: true })).toBeVisible();

  await crearProveedor(page);
  await registrarRecepcion(page, { litros: 1000, acidez: 16, temperatura: 5, ticket });

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(new RegExp(`ticket ${ticket}`, 'i'))).toBeVisible();
  await descartarRegistro(page);
  await expect(page.getByText('No hay recepciones con estos filtros.')).toBeVisible();
});

test('recepción: a double click on Registrar saves only one', async ({ page }) => {
  await crearProveedor(page);
  // Slow response so the second click lands while the first request is in flight
  await page.route('**/api/Proveedores/*/recepciones', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.continue();
  });

  const dialog = await abrirRegistro(page);
  await rellenar(dialog.getByLabel(/^Litros/), '1000');
  await rellenar(dialog.getByLabel(/^Acidez/), '16');
  await rellenar(dialog.getByLabel(/^Temperatura/), '5');
  await dialog.getByRole('button', { name: 'Registrar', exact: true }).dblclick();

  await expect(page.getByText('1 de 1 recepciones')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('1 de 1 recepciones')).toBeVisible();
});

test('recepción: a form with data asks before discarding, a backdrop click never closes it, a clean one closes', async ({ page }) => {
  await crearProveedor(page);
  await abrirRegistro(page);

  // Clean form: Esc closes without asking
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const abierto = await abrirRegistro(page);
  await rellenar(abierto.getByLabel(/^Litros/), '1000');

  // A click on the backdrop does nothing
  await page.mouse.click(5, 300);
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByRole('alertdialog')).toHaveCount(0);

  // Esc asks; "Seguir editando" keeps the dialog and what was typed
  await page.keyboard.press('Escape');
  const pregunta = page.getByRole('alertdialog');
  await expect(pregunta.getByText('¿Descartar la recepción sin guardar?')).toBeVisible();
  await pregunta.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(abierto.getByLabel(/^Litros/)).toHaveValue('1000');

  // Cancelar asks too; "Descartar" closes
  await abierto.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('alertdialog').getByText('¿Descartar la recepción sin guardar?')).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Descartar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('1 de 1 recepciones')).toHaveCount(0);
});
