import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';

let counter = 0;

// Unique per test run and per call: runs against a database that is not fresh must not collide.
function uniqueSuffix(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter}`;
}

/** A ticket number that no other test (or previous run) has used. Ticket is a positive 32-bit int. */
export function ticketUnico(): number {
  counter += 1;
  return 1_000_000 + ((Date.now() % 1_000_000_000) + counter) % 1_000_000_000;
}

export function nombreUnico(): string {
  return `E2E ${uniqueSuffix()}`;
}

function adminPassword(): string {
  const password = process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('Set E2E_ADMIN_PASSWORD (or ADMIN_PASSWORD in ../.env) to log in.');
  }
  return password;
}

/**
 * Fills a field and checks that the value stuck. With tracing on, a fill typed right after a Material dialog
 * opens was lost now and then (a different field each time), so retry until the value is really there.
 */
export async function rellenar(campo: Locator, valor: string): Promise<void> {
  await expect(async () => {
    await campo.fill(valor);
    await expect(campo).toHaveValue(valor, { timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
}

export async function login(page: Page, password = adminPassword()): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('admin');
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
}

export async function loginYEsperarResumen(page: Page): Promise<void> {
  await login(page);
  await expect(page.getByRole('heading', { name: 'Resumen de recepciones' })).toBeVisible();
}

/** Creates a proveedor with a unique name through the UI and opens its detail page. */
export async function crearProveedor(page: Page): Promise<string> {
  const nombre = nombreUnico();
  await page.getByRole('link', { name: 'Proveedores' }).click();
  await page.getByRole('button', { name: 'Nuevo proveedor' }).click();
  await rellenar(page.getByRole('dialog').getByLabel('Nombre'), nombre);
  await page.getByRole('dialog').getByRole('button', { name: 'Crear' }).click();
  await page.getByRole('link', { name: new RegExp(nombre) }).click();
  await expect(page.getByRole('heading', { name: nombre })).toBeVisible();
  return nombre;
}

export interface ValoresRecepcion {
  litros: number | string;
  acidez: number | string;
  temperatura: number | string;
  ticket?: number | string;
}

/** Opens the registration dialog on a proveedor's detail page, fills it and presses "Registrar". */
export async function registrarRecepcion(page: Page, valores: ValoresRecepcion): Promise<void> {
  await page.getByRole('button', { name: 'Registrar recepción' }).click();
  const dialog = page.getByRole('dialog');
  await rellenar(dialog.getByLabel(/^Litros/), String(valores.litros));
  await rellenar(dialog.getByLabel(/^Acidez/), String(valores.acidez));
  await rellenar(dialog.getByLabel(/^Temperatura/), String(valores.temperatura));
  if (valores.ticket !== undefined) {
    await rellenar(dialog.getByLabel(/^Ticket/), String(valores.ticket));
  }
  await dialog.getByRole('button', { name: 'Registrar', exact: true }).click();
}

/** Default acidez máxima (LimitesCalidad.Predeterminados). Tests that change it restore this value. */
export const ACIDEZ_MAXIMA_PREDETERMINADA = 19;

/**
 * Presses "Guardar" on Configuración and waits until the save really finished: the PUT answered 200 and the
 * snackbar is shown. The "Última modificación" text is visible from the first load, so it proves nothing.
 */
export async function guardarLimites(page: Page): Promise<void> {
  const respuesta = page.waitForResponse(
    (r) => r.url().endsWith('/api/Configuracion/calidad') && r.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: 'Guardar' }).click();
  expect((await respuesta).status()).toBe(200);
  await expect(page.getByText('Configuración guardada.').first()).toBeVisible();
}

/** The acidez máxima stored by the API right now (not what the form shows). */
export async function acidezMaximaEnApi(page: Page, request: APIRequestContext): Promise<number> {
  const token = await page.evaluate(() => localStorage.getItem('dairycontrol_token'));
  const respuesta = await request.get('/api/Configuracion/calidad', {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(respuesta.status()).toBe(200);
  return (await respuesta.json()).acidezMaxima;
}
