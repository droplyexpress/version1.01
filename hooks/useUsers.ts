import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { User } from '@shared/types';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useUsersByRole(rol: string) {
  return useQuery({
    queryKey: ['users', rol],
    queryFn: () => userService.getUsersByRole(rol),
    refetchInterval: 10000,
    enabled: !!rol,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
  });
}

export function useAvailableDrivers() {
  return useQuery({
    queryKey: ['available-drivers'],
    queryFn: () => userService.getAvailableDrivers(),
    refetchInterval: 10000,
  });
}

export function useAdmins() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: () => userService.getAdmins(),
    refetchInterval: 10000,
  });
}

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => userService.getClients(),
    refetchInterval: 10000,
  });
}

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: () => userService.getDrivers(),
    refetchInterval: 10000,
  });
}

export function useUserCountByRole() {
  return useQuery({
    queryKey: ['user-count-by-role'],
    queryFn: async () => {
      try {
        const result = await userService.getUserCountByRole();
        return result || { admin: 0, cliente: 0, repartidor: 0 };
      } catch (error) {
        console.error('Error fetching user counts:', error);
        return { admin: 0, cliente: 0, repartidor: 0 };
      }
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: any) => {
      try {
        const result = await userService.createUser(user);
        console.log('[useCreateUser] User created:', result);
        return result;
      } catch (error) {
        console.error('[useCreateUser] Error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      console.log('[useCreateUser] onSuccess triggered, invalidating queries...');
      try {
        await queryClient.invalidateQueries({ queryKey: ['users'] });
        await queryClient.invalidateQueries({ queryKey: ['user-count-by-role'] });
        console.log('[useCreateUser] Queries invalidated successfully');
      } catch (error) {
        console.error('[useCreateUser] Error invalidating queries:', error);
      }
    },
    onError: (error) => {
      console.error('[useCreateUser] Mutation error:', error);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) =>
      userService.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['available-drivers'] });
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      userService.toggleUserStatus(id, activo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['available-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['user-count-by-role'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-count-by-role'] });
    },
  });
}
