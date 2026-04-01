import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { entriesAPI } from '../utils/api';
import { LearningEntry } from '../types';

export const useEntries = (filters?: any) => {
  return useQuery({
    queryKey: ['entries', filters],
    queryFn: () => entriesAPI.getAll(filters),
  });
};

export const useInfiniteEntries = (filters?: any, limit = 20) => {
  return useInfiniteQuery({
    queryKey: ['entries', 'infinite', filters],
    queryFn: ({ pageParam }) => entriesAPI.getPage(filters, pageParam as string, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

export const useCreateEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => entriesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};

export const useDeleteEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entriesAPI.delete(id),
    // Optimistic Update
    onMutate: async (id) => {
      // Cancel refetches
      await queryClient.cancelQueries({ queryKey: ['entries'] });

      // Snapshot current state
      const previousEntries = queryClient.getQueryData(['entries']);

      // Optimistically update cache (for infinite query)
      queryClient.setQueriesData({ queryKey: ['entries', 'infinite'] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((entry: LearningEntry) => entry.id !== id),
          })),
        };
      });

      return { previousEntries };
    },
    onError: (_err, _id, context) => {
      if (context?.previousEntries) {
        queryClient.setQueryData(['entries'], context.previousEntries);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};
