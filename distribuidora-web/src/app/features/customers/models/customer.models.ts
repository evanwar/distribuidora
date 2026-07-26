export interface CustomerRequest {
  name: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  creditLimit: number;
  creditBlocked: boolean;
  active: boolean;
}

export interface CustomerVm extends CustomerRequest {
  id: string;
}

export function toCustomerVm(value: unknown): CustomerVm {
  const source = isRecord(value) ? value : {};
  return {
    id: String(source['id'] ?? ''),
    name: String(source['name'] ?? ''),
    taxId: String(source['taxId'] ?? ''),
    phone: String(source['phone'] ?? ''),
    email: String(source['email'] ?? ''),
    address: String(source['address'] ?? ''),
    city: String(source['city'] ?? ''),
    creditLimit: Number(source['creditLimit'] ?? 0),
    creditBlocked: Boolean(source['creditBlocked']),
    active: source['active'] !== false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
