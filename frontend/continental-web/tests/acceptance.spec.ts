import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const tag = () => `QA-PA03-${randomUUID().replace(/-/g, '').slice(0, 10)}`;
const row = (page: Page, value: string) => page.getByRole('row').filter({
  has: page.getByRole('cell').filter({ hasText: value }),
});
const alert = (page: Page, message: string | RegExp) =>
  page.getByRole('alert').filter({ hasText: message });

async function evidence(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: 'image/png' });
}

async function login(page: Page) {
  const email = process.env.QA_OWNER_EMAIL;
  const password = process.env.QA_OWNER_PASSWORD;
  if (!email || !password || !process.env.QA_BASE_URL) {
    throw new Error('Configura QA_BASE_URL, QA_OWNER_EMAIL y QA_OWNER_PASSWORD.');
  }
  await page.goto('/login');
  // El componente login no se adjuntó: selectores HTML habituales.
  await page.locator('input[type="email"], input[name="correo"], input[name="email"], #correo, #email').first().fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"], form button:not([type])').first().click();
  await page.waitForURL(url => url.pathname !== '/login', { timeout: 90_000 });
}

// Solo las precondiciones se crean vía API del frontend, con la cookie
// de la sesión del navegador. Las acciones evaluadas se hacen en la UI.
async function setupRecord(
  page: Page,
  route: string,
  data: object
) {
  const response = await page.request.post(route, {
    data,
    timeout: 60_000
  });

  if (!response.ok()) {
    throw new Error(
      `Precondición ${route}: HTTP ${response.status()}\n` +
      `Respuesta: ${await response.text()}`
    );
  }

  return (await response.json()).data;
}

async function setupCategory(page: Page, name: string) {
  return setupRecord(page, '/api/categories', { nombre: name, descripcion: 'Prueba PA03' });
}

function productData(idCategoria: number, code: string, name: string) {
  return { idCategoria, codigoBarras: code, nombre: name, descripcion: 'Prueba PA03',
    precioCompra: 3.5, precioVenta: 5, stockMinimo: 5, controlaVencimiento: false };
}

function providerData(document: string, name: string) {
  return {
    documento: document,
    razonSocial: name,
    telefono: '999999999',
    correo: `${document.toLowerCase()}@example.com`,
    direccion: 'Huancayo'
  };
}
async function fillProduct(page: Page, category: string, code: string, name: string) {
  await page.locator('#idCategoria').selectOption({ label: category });
  await page.locator('#codigoBarras').fill(code);
  await page.locator('#nombre').fill(name);
  await page.locator('#precioCompra').fill('3.50');
  await page.locator('#precioVenta').fill('5.00');
  await page.locator('#stockMinimo').fill('5');
  await page.locator('#descripcion').fill('Prueba PA03');
  await page.locator('#controlaVencimiento').selectOption({
  label: 'No',
});
}

async function fillCategory(page: Page, name: string) {
  await page.locator('#nombre').fill(name);
  await page.locator('#descripcion').fill('Prueba PA03');
}

async function fillProvider(
  page: Page,
  document: string,
  name: string
) {
  await page.locator('#documento').fill(document);
  await page.locator('#razonSocial').fill(name);
  await page.locator('#telefono').fill('999999999');
  await page.locator('#correo').fill(
    `${document.toLowerCase()}@example.com`
  );
  await page.locator('#direccion').fill('Huancayo');
}

async function setupPurchase(page: Page) {
  const id = tag();
  const category = await setupCategory(page, `Categoria ${id}`);
  const productName = `Producto ${id}`;
  const providerName = `Proveedor ${id}`;
  const product = await setupRecord(page, '/api/products', productData(category.idCategoria, id, productName));
  const provider = await setupRecord(page, '/api/providers', providerData(id, providerName));
  return { id, productName, providerName, productId: product.idProducto, providerId: provider.idProveedor };
}

type PurchaseFixture = Awaited<ReturnType<typeof setupPurchase>>;
async function fillPurchase(page: Page, fixture: PurchaseFixture, quantity: number) {
  await page.goto('/compras');
  await page.locator('#purchase-provider').selectOption(String(fixture.providerId));
  await page.locator('#purchase-observation').fill(fixture.id);
  await page.locator('#purchase-product').selectOption(String(fixture.productId));
  await page.getByRole('button', { name: 'Agregar producto', exact: true }).click();
  const qty = page.getByRole('spinbutton', { name: `Cantidad de ${fixture.productName}`, exact: true });
  await qty.fill(String(quantity));
  await page.getByRole('spinbutton', { name: `Costo unitario de ${fixture.productName}`, exact: true }).fill('4');
  return qty;
}

async function checkStock(page: Page, code: string, expected: number) {
  await page.goto('/productos');
  await page.locator('#search').fill(code);
  const product = row(page, code);
  await expect(product).toHaveCount(1);
  await expect(product.getByRole('cell').nth(5)).toHaveText(String(expected));
}

async function searchPurchases(page: Page, provider: string) {
  await page.getByPlaceholder('Proveedor, usuario o número...').fill(provider);
  await expect(page.getByText('Cargando compras…', { exact: true })).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('HU01 AT-01 Producto válido aparece activo en catálogo', async ({ page }, info) => {
  const id = tag();
  const category = `Categoria ${id}`;
  const name = `Producto ${id}`;
  await setupCategory(page, category);
  await page.goto('/productos');
  await fillProduct(page, category, id, name);
  await page.getByRole('button', { name: 'Registrar producto', exact: true }).click();
  await expect(alert(page, 'Producto registrado correctamente.')).toBeVisible();
  await evidence(page, info, 'AT-01-mensaje');
  await page.locator('#search').fill(id);
  const product = row(page, id);
  await expect(product).toHaveCount(1);
  await expect(product.getByText(name, { exact: true })).toBeVisible();
  await expect(product.getByText('Sin stock', { exact: true })).toBeVisible();
  await expect(product.getByRole('button', { name: 'Desactivar producto' })).toBeVisible();
  await evidence(page, info, 'AT-01-catalogo');
});

test('HU01 AT-02 Código duplicado rechazado', async ({ page }, info) => {
  const id = tag();
  const categoryName = `Categoria ${id}`;
  const name = `Producto ${id}`;
  const category = await setupCategory(page, categoryName);
  await setupRecord(page, '/api/products', productData(category.idCategoria, id, name));
  await page.goto('/productos');
  await fillProduct(page, categoryName, id, `Duplicado ${id}`);
  await page.getByRole('button', { name: 'Registrar producto', exact: true }).click();
  await expect(alert(page, /código de barras ya está registrado/i)).toBeVisible();
  await evidence(page, info, 'AT-02-rechazo');
  await page.reload();
  await page.locator('#search').fill(id);
  await expect(row(page, id)).toHaveCount(1);
  await expect(row(page, id).getByText(name, { exact: true })).toBeVisible();
});

test('HU02 AT-03 Categoría válida disponible para productos', async ({ page }, info) => {
  const name = `Categoria ${tag()}`;
  await page.goto('/categorias');
  await fillCategory(page, name);
  await page.getByRole('button', { name: 'Registrar categoría', exact: true }).click();
  await expect(alert(page, 'Categoría registrada correctamente.')).toBeVisible();
  await evidence(page, info, 'AT-03-mensaje');
  await page.locator('#search').fill(name);
  await expect(row(page, name).getByText('Activo', { exact: true })).toBeVisible();
  await page.goto('/productos');
  await page.locator('#idCategoria').selectOption({ label: name });
  await expect(page.locator('#idCategoria option:checked')).toHaveText(name);
  await evidence(page, info, 'AT-03-categoria-disponible');
});

test('HU02 AT-04 Categoría duplicada rechazada', async ({ page }, info) => {
  const name = `Categoria ${tag()}`;
  await setupCategory(page, name);
  await page.goto('/categorias');
  await fillCategory(page, name);
  await page.getByRole('button', { name: 'Registrar categoría', exact: true }).click();
  await expect(alert(page, /ya existe una categoría con ese nombre/i)).toBeVisible();
  await evidence(page, info, 'AT-04-rechazo');
  await page.reload();
  await page.locator('#search').fill(name);
  await expect(row(page, name)).toHaveCount(1);
});

test('HU03 AT-05 Proveedor válido aparece activo', async ({ page }, info) => {
  const id = tag();
  const name = `Proveedor ${id}`;
  await page.goto('/proveedores');
  await fillProvider(page, id, name);
  await page.getByRole('button', { name: 'Registrar proveedor', exact: true }).click();
  await expect(alert(page, 'Proveedor registrado correctamente.')).toBeVisible();
  await evidence(page, info, 'AT-05-mensaje');
  await page.locator('#search').fill(id);
  await expect(row(page, id).getByText(name, { exact: true })).toBeVisible();
  await expect(row(page, id).getByText('Activo', { exact: true })).toBeVisible();
  await evidence(page, info, 'AT-05-proveedor-activo');
});

test('HU03 AT-06 Documento duplicado rechazado', async ({ page }, info) => {
  const id = tag();
  const name = `Proveedor ${id}`;
  await setupRecord(page, '/api/providers', providerData(id, name));
  await page.goto('/proveedores');
  await fillProvider(page, id, `Duplicado ${id}`);
  await page.getByRole('button', { name: 'Registrar proveedor', exact: true }).click();
  await expect(alert(page, /documento ya está registrado/i)).toBeVisible();
  await evidence(page, info, 'AT-06-rechazo');
  await page.reload();
  await page.locator('#search').fill(id);
  await expect(row(page, id)).toHaveCount(1);
  await expect(row(page, id).getByText(name, { exact: true })).toBeVisible();
});

test('HU04 AT-07 Compra válida incrementa stock', async ({ page }, info) => {
  const fixture = await setupPurchase(page);
  await checkStock(page, fixture.id, 0);
  await evidence(page, info, 'AT-07-stock-inicial');
  await fillPurchase(page, fixture, 10);
  await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();
  await expect(alert(page, 'Compra registrada correctamente.')).toBeVisible();
  await evidence(page, info, 'AT-07-mensaje');
  await searchPurchases(page, fixture.providerName);
  const purchase = row(page, fixture.providerName);
  await expect(purchase).toHaveCount(1);
  await expect(purchase.getByText('REGISTRADA', { exact: true })).toBeVisible();
  await expect(purchase.getByRole('cell').nth(5)).toHaveText(/40[.,]00/);
  await evidence(page, info, 'AT-07-compra-registrada');
  await checkStock(page, fixture.id, 10);
  await evidence(page, info, 'AT-07-stock-final');
});

for (const quantity of [0, -1]) {
  test(`HU04 AT-08 Cantidad ${quantity} bloqueada sin modificar stock`, async ({ page }, info) => {
    const fixture = await setupPurchase(page);
    await checkStock(page, fixture.id, 0);
    const qty = await fillPurchase(page, fixture, quantity);
    await expect(qty).toHaveValue(String(quantity));
    let posts = 0;
    page.on('request', request => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/purchases') posts++;
    });
    await page.getByRole('button', { name: 'Registrar compra', exact: true }).click();
    expect(await qty.evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow)).toBe(true);
    await expect(qty).toBeFocused();
    expect(posts).toBe(0);
    await evidence(page, info, `AT-08-cantidad-${quantity}-bloqueada`);
    await page.reload();
    await searchPurchases(page, fixture.providerName);
    await expect(page.getByText('No se encontraron compras.', { exact: true })).toBeVisible();
    await expect(row(page, fixture.providerName)).toHaveCount(0);
    await checkStock(page, fixture.id, 0);
    expect(posts).toBe(0);
    await evidence(page, info, `AT-08-cantidad-${quantity}-stock-sin-cambios`);
  });
}
