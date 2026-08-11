import { expect, test } from '@playwright/test';

test('login remains usable without horizontal overflow', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('language selection persists and is sent to the API', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByRole('button', { name: 'Idioma' }).click();
  await page.getByRole('menuitem', { name: 'English' }).click();

  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  await expect(page.getByLabel('Username')).toBeVisible();
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('test-only');
  const loginRequest = page.waitForRequest((request) =>
    request.url().includes('/api/v1/auth/login'),
  );
  await page.getByRole('button', { name: 'Sign in' }).click();

  expect((await loginRequest).headers()['accept-language']).toBe('en-US');
  await expect(page.getByRole('heading', { name: 'Operations center' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
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

test('payment terminals can be administered without horizontal overflow', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('admin');
  await page.getByLabel(/Contrase/).fill('test-only');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await navigateFromShell(page, 'Terminales de pago');

  await expect(
    page.getByRole('heading', { name: 'Terminales de pago', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Mostrador principal')).toBeVisible();
  await expect(page.getByText('Predeterminada', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Nueva terminal' }).click();
  const createDialog = page.getByRole('dialog');
  await expect(createDialog.getByRole('heading', { name: 'Registrar terminal' })).toBeVisible();
  await expect(createDialog.getByLabel('Nombre de la terminal')).toBeFocused();
  await expect(createDialog.getByLabel('Nombre de la terminal')).toHaveValue('');
  const dialogBox = await createDialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await createDialog.getByRole('button', { name: 'Cancelar' }).click();

  await page.getByRole('button', { name: 'Editar' }).click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog.getByRole('heading', { name: 'Editar terminal' })).toBeVisible();
  await expect(editDialog.getByLabel('Nombre de la terminal')).toHaveValue('Mostrador principal');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
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

test('product aliases load products from the paged catalog', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('admin');
  await page.getByLabel(/Contrase/).fill('test-only');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await navigateFromShell(page, 'Otros catálogos');

  await page.getByRole('link', { name: /Aliases de producto/ }).click();
  await page.getByRole('button', { name: 'Nuevo alias' }).first().click();
  const product = page.getByRole('combobox', { name: 'Producto' });
  await product.click();
  await expect(page.getByRole('option', { name: 'ARZ-001 · Arroz premium' })).toBeVisible();
});

test('paged operational logs render their records', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('admin');
  await page.getByLabel(/Contrase/).fill('test-only');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await navigateFromShell(page, 'Auditoría y soporte');

  await page.getByRole('button', { name: /Actividad de usuarios/ }).click();
  await page.getByRole('button', { name: 'Consultar', exact: true }).click();
  await expect(page.getByText('CreatedSale')).toBeVisible();
  await expect(page.getByText('pageSize')).toHaveCount(0);
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
  await expect(page.getByRole('textbox', { name: 'Desde' })).toHaveValue(e2eDisplayDay());
  await expect(page.getByRole('textbox', { name: 'Hasta' })).toHaveValue(e2eDisplayDay());
  await expect(page.getByText('CS-0002')).toBeVisible();
  await expect(page.getByText('CS-0001')).toHaveCount(0);
});

test('every primary module remains usable without global overflow', async ({ page }) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByLabel('Usuario').fill('admin');
  await page.getByLabel(/Contrase/).fill('test-only');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Centro de operación', exact: true }),
  ).toBeVisible();

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
    ['/operations/administration/payment-terminals', 'Terminales de pago'],
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

test('English covers every primary module instead of only the application shell', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/login');
  await page.getByRole('button', { name: 'Idioma' }).click();
  await page.getByRole('menuitem', { name: 'English' }).click();
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('test-only');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Operations center', exact: true })).toBeVisible();

  const modules = [
    ['/dashboard', 'Operations center'],
    ['/operations/counter-sales', 'Point of sale'],
    ['/operations/inventory', 'Inventory'],
    ['/operations/purchases', 'Purchases and receipts'],
    ['/operations/receivables', 'Accounts receivable'],
    ['/customers', 'Customers'],
    ['/suppliers', 'Suppliers'],
    ['/products', 'Products'],
    ['/masters', 'Other catalogs'],
    ['/operations/security', 'Users, roles, and permissions'],
    ['/operations/reports', 'Reports'],
    ['/operations/audit', 'Audit and support'],
    ['/operations/administration', 'Administration'],
    ['/operations/administration/payment-terminals', 'Payment terminals'],
  ] as const;

  const untranslatedShellCopy =
    /Selecciona una tarea|Elige una opción|Consultar el catálogo|Nueva terminal|Agregar productos|Buscar clientes/;
  for (const [path, heading] of modules) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading, exact: true })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(untranslatedShellCopy);
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
        salesTrend: [
          { date: '2026-08-05', sales: 780, transactions: 5 },
          { date: '2026-08-06', sales: 1100, transactions: 7 },
          { date: '2026-08-07', sales: 920, transactions: 6 },
          { date: '2026-08-08', sales: 1680, transactions: 10 },
          { date: '2026-08-09', sales: 1340, transactions: 9 },
          { date: '2026-08-10', sales: 1940, transactions: 12 },
          { date: '2026-08-11', sales: 1250, transactions: 8 },
        ],
        inventoryHealth: {
          healthyProducts: 21,
          lowStockProducts: 2,
          outOfStockProducts: 1,
          availableUnits: 214,
          reservedUnits: 26,
        },
        receivablesAging: {
          current: 180,
          days1To30: 90,
          days31To60: 45,
          days61To90: 25,
          over90: 10,
        },
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
    } else if (path === '/api/v1/admin/payment-terminals/available') {
      data = [
        {
          id: 'terminal-1',
          name: 'Mostrador principal',
          externalId: 'PAX_A910__MAIN',
          provider: 'mercado_pago',
          isDefault: true,
          active: true,
          rowVersion: 0,
        },
      ];
    } else if (path === '/api/v1/admin/payment-terminals') {
      data = [
        {
          id: 'terminal-1',
          name: 'Mostrador principal',
          externalId: 'PAX_A910__MAIN',
          provider: 'mercado_pago',
          description: 'Caja principal',
          isDefault: true,
          active: true,
          rowVersion: 0,
        },
      ];
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
    } else if (path === '/api/v1/logs/activity') {
      data = {
        items: [
          {
            id: 'activity-1',
            action: 'CreatedSale',
            module: 'Sales',
            succeeded: true,
          },
        ],
        page: 1,
        pageSize: 50,
        total: 1,
      };
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

function e2eDisplayDay(offset = 0): string {
  const [year, month, day] = e2eDay(offset).split('-');
  return `${day}/${month}/${year}`;
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
