import { describe, expect, it } from 'vitest';
import { permissionText, systemRoleText } from './business-workspace.i18n';

describe('business workspace localized option text', () => {
  it('uses operational Spanish text instead of permission keys', () => {
    expect(permissionText('admin.configure', false)).toBe('Administración · Configurar el sistema');
    expect(permissionText('sales.register_payment', false)).toBe('Ventas · Registrar pagos');
  });

  it('uses English text when English is configured', () => {
    expect(permissionText('admin.configure', true)).toBe('Administration · Configure system');
    expect(permissionText('sales.register_payment', true)).toBe('Sales · Record payments');
  });

  it('keeps unknown permission keys visible for forward compatibility', () => {
    expect(permissionText('future.permission', false)).toBe('future.permission');
    expect(permissionText('future.permission', true)).toBe('future.permission');
  });

  it('localizes only known system roles', () => {
    expect(systemRoleText('Administrator', false)).toBe('Administrador');
    expect(systemRoleText('Administrator', true)).toBe('Administrator');
    expect(systemRoleText('Gerente de tienda', true)).toBe('Gerente de tienda');
  });
});
