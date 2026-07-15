import { api } from './api';

export type Tenant = {
  id: string;
  name: string;
  slug: string;
};

export async function getTenants() {
  const response = await api.get<Tenant[]>('/tenants', {
    params: {
      _: Date.now(),
    },
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  return response.data;
}