import { expect, test } from '@playwright/test';

test('login remains usable without horizontal overflow', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('the point of sale is an operational flow on every viewport', async ({ page }, testInfo) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('admin');
  await page.getByLabel('Contraseña').fill('test-only');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await navigateFromShell(page, 'Punto de venta');

  await expect(page.getByRole('heading', { name: 'Punto de venta', exact: true })).toBeVisible();
  await expect(page.getByText('/api/v1/counter-sales')).toHaveCount(0);
  const customer = page.getByRole('combobox', { name: 'Cliente' });
  await customer.fill('5512345678');
  const customerOption = page.getByRole('option', {
    name: /Cliente frecuente.*55 1234 5678/,
  });
  await expect(customerOption).toBeVisible();
  await customerOption.click();
  await expect(customer).toHaveValue('Cliente frecuente · 55 1234 5678');
  await page.getByRole('button', { name: 'Agregar una unidad de Arroz premium' }).click();
  await expect(page.getByText('Productos de la venta')).toBeVisible();
  await expect(page.locator('.checkout__total')).toContainText('$45.50');
  await expect(page.getByText('Disponible: 2')).toBeVisible();
  const increase = page.getByRole('button', { name: 'Aumentar cantidad de Arroz premium' });
  await increase.click();
  await expect(increase).toBeDisabled();
  const quantity = page.getByRole('spinbutton', { name: 'Cantidad de Arroz premium' });
  await quantity.fill('9');
  await quantity.blur();
  await expect(quantity).toHaveValue('2');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);

  if (testInfo.project.name === 'desktop') {
    await page.screenshot({ path: 'test-results/counter-sales-desktop.png', fullPage: true });
  }
});

test('business modules hide transport details and expose guided tasks', async ({
  page,
}, testInfo) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('admin');
  await page.getByLabel('Contraseña').fill('test-only');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await navigateFromShell(page, 'Inventario');

  await expect(page.getByRole('heading', { name: 'Inventario' })).toBeVisible();
  await expect(page.getByText('Consultar existencias')).toBeVisible();
  await expect(page.getByText('/api/v1/inventory')).toHaveCount(0);
  await page.getByRole('button', { name: /Consultar existencias/ }).click();
  await page.getByRole('button', { name: 'Consultar', exact: true }).click();
  await expect(page.getByText('Resultado')).toBeVisible();
  await expect(page.getByText('Almacén principal')).toBeVisible();
  if (testInfo.project.name === 'desktop') {
    await page.screenshot({ path: 'test-results/inventory-desktop.png', fullPage: true });
  }

  await page.getByRole('button', { name: /Registrar ajuste/ }).click();
  const warehouse = page.getByRole('combobox', { name: 'Almacén', exact: true });
  await expect(warehouse).toContainText('Almacén principal');
  const product = page.getByRole('combobox', { name: 'Producto', exact: true });
  await product.focus();
  await product.press('Enter');
  await page.getByRole('option', { name: 'ARZ-001 · Arroz premium' }).click();
  await expect(product).toContainText('ARZ-001 · Arroz premium');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(page.getByText('ID de almacén')).toHaveCount(0);
  await expect(page.getByText('ID de producto')).toHaveCount(0);
  if (testInfo.project.name === 'desktop') {
    await page.screenshot({
      path: 'test-results/inventory-adjustment-desktop.png',
      fullPage: true,
    });
  }
});

test('products render the paged backend response', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('admin');
  await page.getByLabel(/Contrase/).fill('test-only');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await navigateFromShell(page, 'Productos');

  await expect(page.getByRole('heading', { name: 'Productos', exact: true })).toBeVisible();
  await expect(
    page.locator('td:visible, dd:visible').filter({ hasText: 'Arroz premium' }),
  ).toHaveCount(1);
  await expect(
    page.locator('td:visible, strong:visible').filter({ hasText: 'ARZ-001' }),
  ).toHaveCount(1);
  await expect(page.locator('mat-paginator')).toBeVisible();
  await expect(page.locator('mat-paginator')).toContainText('1');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('purchase lookup explains an empty catalog and offers the next step', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('admin');
  await page.getByLabel(/Contrase/).fill('test-only');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await navigateFromShell(page, 'Compras');

  await page.getByRole('button', { name: /Consultar una compra/ }).click();
  await expect(page.getByRole('heading', { name: 'Todavía no hay compras' })).toBeVisible();
  await expect(page.getByText(/Primero registra una orden de compra/)).toBeVisible();
  await page.getByRole('button', { name: 'Registrar una compra' }).click();
  await expect(page.getByRole('heading', { name: 'Nueva orden de compra' })).toBeVisible();
});

test('sales history can be searched and inspected without knowing an id', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('admin');
  await page.getByLabel(/Contrase/).fill('test-only');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await navigateFromShell(page, 'Punto de venta');

  await page.getByRole('button', { name: 'Ver historial' }).click();
  const search = page.getByLabel('Buscar ventas');
  await search.fill('cliente frecuente');
  await expect(page.getByText('CS-0002')).toBeVisible();
  await expect(page.getByText('CS-0001')).toHaveCount(0);

  await page.getByRole('button', { name: 'Ver detalle de CS-0002' }).click();
  await expect(page.getByText('Detalle de CS-0002')).toBeVisible();
  await expect(page.getByText('Arroz premium')).toBeVisible();

  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(page.getByText('CS-0001')).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('dashboard metrics open the corresponding operational query', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('admin');
  await page.getByLabel(/Contrase/).fill('test-only');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await page.getByRole('link', { name: 'Consultar ventas de hoy' }).click();
  await expect(page.getByRole('heading', { name: 'Ventas recientes' })).toBeVisible();
  await expect(page.getByLabel('Desde')).toHaveValue(e2eDay());
  await expect(page.getByLabel('Hasta')).toHaveValue(e2eDay());
  await expect(page.getByText('CS-0002')).toBeVisible();
  await expect(page.getByText('CS-0001')).toHaveCount(0);
});

test('every primary module remains usable without global overflow', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('admin');
  await page.getByLabel(/Contrase/).fill('test-only');
  await page.getByRole('button', { name: 'Entrar' }).click();

  const modules = [
    ['/dashboard', 'Centro de operación'],
    ['/operations/counter-sales', 'Punto de venta'],
    ['/operations/inventory', 'Inventario'],
    ['/operations/purchases', 'Compras y recepciones'],
    ['/operations/receivables', 'Cuentas por cobrar'],
    ['/customers', 'Clientes'],
    ['/suppliers', 'Proveedores'],
    ['/products', 'Productos'],
    ['/masters', 'Otros Catálogos'],
    ['/operations/security', 'Usuarios, roles y permisos'],
    ['/operations/reports', 'Reportes'],
    ['/operations/audit', 'Auditoría y soporte'],
    ['/operations/administration', 'Administración'],
  ] as const;

  for (const [path, heading] of modules) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, `${path} must not overflow`).toBe(false);
  }
});

async function mockApi(page: import('@playwright/test').Page): Promise<void> {
  const token = [
    encode({ alg: 'none', typ: 'JWT' }),
    encode({ name: 'Administrador', sub: 'admin', permission: ['*'] }),
    'test',
  ].join('.');

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let data: unknown = {};

    if (path === '/api/v1/auth/login') {
      data = { accessToken: token, refreshToken: 'test-refresh' };
    } else if (path === '/api/v1/dashboard/summary') {
      data = {
        todaySales: 1250,
        todayTransactions: 8,
        inventoryUnits: 240,
        lowStockProducts: 2,
        receivables: 350,
      };
    } else if (path === '/api/v1/products') {
      data = {
        items: [
          {
            id: 'product-1',
            sku: 'ARZ-001',
            name: 'Arroz premium',
            barcode: '750000000001',
            basePrice: 45.5,
            active: true,
          },
        ],
        page: 1,
        pageSize: 25,
        total: 1,
      };
    } else if (path === '/api/v1/customers') {
      data = [
        {
          id: 'customer-1',
          name: 'Cliente frecuente',
          phone: '55 1234 5678',
          creditBlocked: false,
        },
      ];
    } else if (path === '/api/v1/warehouses') {
      data = [{ id: 'warehouse-1', name: 'Almacén principal', active: true }];
    } else if (path === '/api/v1/admin/payment-methods') {
      data = [{ code: 'cash', name: 'Efectivo', requiresReference: false, active: true }];
    } else if (path === '/api/v1/counter-sales') {
      data = [
        {
          id: 'sale-2',
          folio: 'CS-0002',
          saleDate: `${e2eDay()}T18:30:00Z`,
          customerId: 'customer-1',
          sourceWarehouseId: 'warehouse-1',
          status: 'Paid',
          paymentCondition: 'Cash',
          subtotal: 45.5,
          discountTotal: 0,
          taxTotal: 0,
          total: 45.5,
          paidAmount: 45.5,
          balance: 0,
          items: [{ productId: 'product-1', quantity: 1, unitPrice: 45.5, discount: 0 }],
        },
        {
          id: 'sale-1',
          folio: 'CS-0001',
          saleDate: `${e2eDay(-1)}T16:00:00Z`,
          customerId: null,
          sourceWarehouseId: 'warehouse-1',
          status: 'Draft',
          paymentCondition: 'Cash',
          subtotal: 45.5,
          discountTotal: 0,
          taxTotal: 0,
          total: 45.5,
          paidAmount: 0,
          balance: 45.5,
          items: [{ productId: 'product-1', quantity: 1, unitPrice: 45.5, discount: 0 }],
        },
      ];
    } else if (path === '/api/v1/inventory/balances') {
      data = [
        {
          id: 'balance-1',
          warehouseId: 'warehouse-1',
          productId: 'product-1',
          warehouseName: 'Almacén principal',
          productName: 'Arroz premium',
          quantity: 2,
          reservedQuantity: 0,
        },
      ];
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data, correlationId: 'e2e-correlation' }),
    });
  });
}

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function e2eDay(offset = 0): string {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function navigateFromShell(
  page: import('@playwright/test').Page,
  destination: string,
): Promise<void> {
  await expect(page.getByRole('heading', { name: 'Centro de operación' })).toBeVisible();
  const link = page.getByRole('link', { name: destination, exact: true });
  if (!(await link.isVisible())) {
    await page.getByRole('button', { name: 'Abrir navegación' }).click();
  }
  await link.click();
}
