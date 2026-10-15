import { expect, type Page } from '@playwright/test';

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
  await page.getByRole('dialog').getByLabel('Nombre').fill(nombre);
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
  await dialog.getByLabel(/^Litros/).fill(String(valores.litros));
  await dialog.getByLabel(/^Acidez/).fill(String(valores.acidez));
  await dialog.getByLabel(/^Temperatura/).fill(String(valores.temperatura));
  if (valores.ticket !== undefined) {
    await dialog.getByLabel(/^Ticket/).fill(String(valores.ticket));
  }
  await dialog.getByRole('button', { name: 'Registrar', exact: true }).click();
}
