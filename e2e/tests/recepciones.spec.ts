import { expect, test } from '@playwright/test';
import { crearProveedor, loginYEsperarResumen, registrarRecepcion, ticketUnico } from '../helpers';

test.beforeEach(async ({ page }) => {
  await loginYEsperarResumen(page);
});

test('recepción: a valid one is saved and listed with its ticket', async ({ page }) => {
  await crearProveedor(page);
  const ticket = ticketUnico();

  await registrarRecepcion(page, { litros: 1500, acidez: 16, temperatura: 5, ticket });

  await expect(page.getByRole('heading', { name: 'Recepciones (1)' })).toBeVisible();
  await expect(page.getByRole('cell', { name: String(ticket), exact: true })).toBeVisible();
});

test('recepción: an impossible value shows its message and is not saved', async ({ page }) => {
  await crearProveedor(page);

  await registrarRecepcion(page, { litros: 1500, acidez: 5, temperatura: 5 });

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Requerido, entre 10 y 30 °D.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByText('Todavía no hay recepciones registradas.')).toBeVisible();
});

test('recepción: a duplicate ticket shows its message and is not saved', async ({ page }) => {
  const ticket = ticketUnico();
  await crearProveedor(page);
  await registrarRecepcion(page, { litros: 1000, acidez: 16, temperatura: 5, ticket });
  await expect(page.getByRole('heading', { name: 'Recepciones (1)' })).toBeVisible();

  await crearProveedor(page);
  await registrarRecepcion(page, { litros: 1000, acidez: 16, temperatura: 5, ticket });

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(new RegExp(`ticket ${ticket}`, 'i'))).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByText('Todavía no hay recepciones registradas.')).toBeVisible();
});
