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
  });

  return response.data;
}