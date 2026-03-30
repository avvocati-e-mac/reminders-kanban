import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api';

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: api.getTemplates,
    staleTime: Infinity,
  });
}

export function useTemplate(id) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => api.getTemplate(id),
    enabled: !!id,
    staleTime: Infinity,
  });
}
