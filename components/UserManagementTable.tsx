import { useState } from 'react';
import { User } from '@shared/types';
import { useToggleUserStatus, useDeleteUser, useUpdateUser } from '@/hooks/useUsers';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Power, Mail, Phone, Eye } from 'lucide-react';
import { UserDetailModal } from './UserDetailModal';

interface UserManagementTableProps {
  users: User[];
  isLoading?: boolean;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  cliente: 'Cliente',
  repartidor: 'Repartidor',
};

const roleBgColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cliente: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  repartidor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export function UserManagementTable({ users, isLoading }: UserManagementTableProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const toggleStatusMutation = useToggleUserStatus();
  const deleteUserMutation = useDeleteUser();
  const updateUserMutation = useUpdateUser();

  const isAdminMaster = currentUser?.email === 'manolo@droplyexpress.com';

  const isUserMaster = (user: User) => user.email === 'manolo@droplyexpress.com';

  const handleToggleStatus = async (user: User) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: user.id,
        activo: !user.activo,
      });

      toast({
        title: 'Éxito',
        description: `${user.nombre} ha sido ${user.activo ? 'desactivado' : 'activado'}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el usuario',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${user.nombre}?`)) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(user.id);

      toast({
        title: 'Éxito',
        description: `${user.nombre} ha sido eliminado`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario',
        variant: 'destructive',
      });
    }
  };

  const handleToggleMasterStatus = async (user: User) => {
    const isMaster = isUserMaster(user);
    const action = isMaster ? 'quitar' : 'promover a';

    if (!confirm(`¿Estás seguro de que deseas ${action} master a ${user.nombre}?`)) {
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        updates: {
          is_master: !isMaster,
        },
      });

      toast({
        title: 'Éxito',
        description: `${user.nombre} ha sido ${isMaster ? 'removido de' : 'promovido a'} master`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `No se pudo ${action} master al usuario`,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await updateUserMutation.mutateAsync({
        id: updatedUser.id,
        updates: updatedUser,
      });

      toast({
        title: 'Éxito',
        description: `${updatedUser.nombre} ha sido actualizado`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el usuario',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 h-20 animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No hay usuarios</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-slate-700">
            <th className="text-left px-4 py-3 font-semibold text-slate-900 dark:text-white">
              Nombre
            </th>
            <th className="text-left px-4 py-3 font-semibold text-slate-900 dark:text-white">
              Email
            </th>
            <th className="text-left px-4 py-3 font-semibold text-slate-900 dark:text-white">
              Rol
            </th>
            <th className="text-left px-4 py-3 font-semibold text-slate-900 dark:text-white">
              Vehículo
            </th>
            <th className="text-left px-4 py-3 font-semibold text-slate-900 dark:text-white">
              Estado
            </th>
            <th className="text-right px-4 py-3 font-semibold text-slate-900 dark:text-white">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{user.nombre}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-600 dark:text-gray-400">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  {user.telefono}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    roleBgColors[user.rol]
                  }`}
                >
                  {roleLabels[user.rol]}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {user.vehiculo || '-'}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.activo
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}
                >
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedUser(user)}
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {!isUserMaster(user) && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(user)}
                        disabled={toggleStatusMutation.isPending}
                        title={user.activo ? 'Desactivar' : 'Activar'}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(user)}
                        disabled={deleteUserMutation.isPending}
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {isAdminMaster && user.rol === 'admin' && (
                    <Button
                      size="sm"
                      variant={isUserMaster(user) ? 'destructive' : 'default'}
                      onClick={() => handleToggleMasterStatus(user)}
                      disabled={updateUserMutation.isPending}
                      title={isUserMaster(user) ? 'Quitar Master' : 'Promover a Master'}
                      className={isUserMaster(user) ? '' : 'bg-amber-500 hover:bg-amber-600'}
                    >
                      {isUserMaster(user) ? '👑 Quitar Master' : '👑 Promover a Master'}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={handleUpdateUser}
          isAdminMaster={isAdminMaster}
        />
      )}
    </div>
  );
}
