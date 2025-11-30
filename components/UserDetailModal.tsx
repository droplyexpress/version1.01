import { useState, useEffect } from 'react';
import { User } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useUpdateUser } from '@/hooks/useUsers';
import { X, Copy, Eye, EyeOff } from 'lucide-react';

interface UserDetailModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedUser: User) => Promise<void>;
  isAdminMaster?: boolean;
}

const roleOptions = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'repartidor', label: 'Repartidor' },
  { value: 'admin', label: 'Administrador' },
];

const vehicleTypes = [
  'Bicicleta',
  'Moto',
  'Coche',
  'Furgoneta',
  'Camión',
];

const countryOptions = [
  { value: 'ES', label: 'España' },
  { value: 'MX', label: 'México' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CL', label: 'Chile' },
  { value: 'PE', label: 'Perú' },
];

export function UserDetailModal({
  user,
  isOpen,
  onClose,
  onUpdate,
  isAdminMaster = false,
}: UserDetailModalProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const updateUserMutation = useUpdateUser();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [formData, setFormData] = useState({
    nombre: user.nombre || '',
    email: user.email || '',
    telefono: user.telefono || '',
    rol: user.rol || 'cliente',
    vehiculo: user.vehiculo || '',
    direccion: user.direccion || '',
    codigo_postal: user.codigo_postal || '',
    ciudad: user.ciudad || '',
    pais: user.pais || 'ES',
    activo: user.activo ?? true,
  });

  // Update formData when user prop changes
  useEffect(() => {
    setFormData({
      nombre: user.nombre || '',
      email: user.email || '',
      telefono: user.telefono || '',
      rol: user.rol || 'cliente',
      vehiculo: user.vehiculo || '',
      direccion: user.direccion || '',
      codigo_postal: user.codigo_postal || '',
      ciudad: user.ciudad || '',
      pais: user.pais || 'ES',
      activo: user.activo ?? true,
    });
  }, [user.id]);

  const handleSave = async () => {
    if (!formData.nombre || !formData.telefono) {
      toast({
        title: 'Error',
        description: 'Nombre y teléfono son requeridos',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser: User = {
        ...user,
        ...formData,
      };

      if (onUpdate) {
        await onUpdate(updatedUser);
      }

      toast({
        title: 'Éxito',
        description: 'Usuario actualizado correctamente',
        duration: 2000,
      });

      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el usuario',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isUserMaster = (user: User) => user.email === 'manolo@droplyexpress.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user.email);
    toast({
      title: 'Copiado',
      description: 'Email copiado al portapapeles',
      duration: 1500,
    });
  };

  const handleToggleMasterStatus = async () => {
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

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: `No se pudo ${action} master al usuario`,
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!isAdminMaster) {
      toast({
        title: 'Permiso denegado',
        description: 'Solo el administrador master puede resetear contraseñas',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`\u00bfEstás seguro de que deseas resetear la contraseña de ${user.nombre}?`)) {
      return;
    }

    setIsResettingPassword(true);
    try {
      console.log('[UserDetailModal] Resetting password for user:', user.id);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[UserDetailModal] Failed to parse response:', parseError);
        throw new Error('Error al procesar la respuesta del servidor');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Error al resetear contraseña');
      }

      if (!data.success || !data.temporaryPassword) {
        throw new Error(data.message || 'No se pudo generar contraseña temporal');
      }

      setTemporaryPassword(data.temporaryPassword);
      toast({
        title: 'Éxito',
        description: 'Contraseña temporal generada. Comparte con el usuario.',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo resetear la contraseña',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCopyPassword = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      toast({
        title: 'Copiado',
        description: 'Contraseña copiada al portapapeles',
        duration: 1500,
      });
    }
  };

  const isChangingOwnPassword = currentUser?.id === user.id;

  const handleChangePassword = async () => {
    if (!passwordData.newPassword) {
      toast({
        title: 'Error',
        description: 'La contraseña nueva es requerida',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    // If user is changing their own password, require current password
    if (isChangingOwnPassword && !passwordData.currentPassword) {
      toast({
        title: 'Error',
        description: 'Debes ingresar tu contraseña actual',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          newPassword: passwordData.newPassword,
          currentPassword: isChangingOwnPassword ? passwordData.currentPassword : undefined,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[UserDetailModal] Failed to parse response:', parseError);
        throw new Error('Error al procesar la respuesta del servidor');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar contraseña');
      }

      toast({
        title: 'Éxito',
        description: data.message || 'Contraseña actualizada correctamente',
        duration: 3000,
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo cambiar la contraseña',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Editar Usuario' : 'Detalles del Usuario'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información General */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Nombre Completo
                </label>
                <Input
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  disabled={!isEditing}
                  placeholder="Juan García López"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Email (Será su login)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.email}
                    disabled
                    placeholder="juan@example.com"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyEmail}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Teléfono
                </label>
                <Input
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  disabled={!isEditing}
                  placeholder="+34 612 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) =>
                    setFormData({ ...formData, rol: e.target.value as any })
                  }
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {isAdminMaster && formData.rol === 'admin' && (
                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant={isUserMaster(user) ? 'destructive' : 'default'}
                    onClick={handleToggleMasterStatus}
                    disabled={updateUserMutation.isPending || isEditing}
                    className={isUserMaster(user) ? '' : 'bg-amber-500 hover:bg-amber-600 w-full'}
                    title={isUserMaster(user) ? 'Quitar Master' : 'Promover a Master'}
                  >
                    {isUserMaster(user) ? '👑 Quitar Master' : '👑 Promover a Master'}
                  </Button>
                </div>
              )}

              {formData.rol === 'repartidor' && (
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Tipo de Vehículo
                  </label>
                  <select
                    value={formData.vehiculo}
                    onChange={(e) =>
                      setFormData({ ...formData, vehiculo: e.target.value })
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Seleccionar veh��culo</option>
                    {vehicleTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Estado
                </label>
                <select
                  value={formData.activo ? 'activo' : 'inactivo'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      activo: e.target.value === 'activo',
                    })
                  }
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dirección (para clientes) */}
          {formData.rol === 'cliente' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Dirección de Recogida (Padrón)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Dirección Completa
                  </label>
                  <Input
                    value={formData.direccion}
                    onChange={(e) =>
                      setFormData({ ...formData, direccion: e.target.value })
                    }
                    disabled={!isEditing}
                    placeholder="Calle Principal 123, Apartamento 4B"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Código Postal
                  </label>
                  <Input
                    value={formData.codigo_postal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        codigo_postal: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    placeholder="28001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Ciudad
                  </label>
                  <Input
                    value={formData.ciudad}
                    onChange={(e) =>
                      setFormData({ ...formData, ciudad: e.target.value })
                    }
                    disabled={!isEditing}
                    placeholder="Madrid"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                    País
                  </label>
                  <select
                    value={formData.pais}
                    onChange={(e) =>
                      setFormData({ ...formData, pais: e.target.value })
                    }
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
                  >
                    {countryOptions.map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Información de Acceso */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
              Información de Acceso
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Email para Login
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-blue-300 dark:border-blue-700">
                    <p className="text-slate-900 dark:text-white text-sm break-all">
                      {user.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyEmail}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Temporary Password Section */}
              {temporaryPassword && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                    ✓ Contraseña Temporal Generada
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 rounded border border-green-300 dark:border-green-700">
                      <p className="text-slate-900 dark:text-white text-sm font-mono font-semibold">
                        {showPassword ? temporaryPassword : '••••••••'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Ocultar' : 'Mostrar'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPassword}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-green-800 dark:text-green-200 mt-2">
                    Comparte esta contraseña temporal con el usuario. Puede cambiarla después de iniciar sesión.
                  </p>
                </div>
              )}

              {/* Reset Password Button */}
              {isAdminMaster && !temporaryPassword && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetPassword}
                  disabled={isResettingPassword}
                  className="w-full"
                >
                  {isResettingPassword ? 'Generando...' : '🔐 Resetear Contraseña'}
                </Button>
              )}

              {isAdminMaster && temporaryPassword && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTemporaryPassword(null)}
                  className="w-full"
                >
                  Cerrar Contraseña Temporal
                </Button>
              )}

              {!isAdminMaster && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <span className="font-semibold">ℹ️ Nota:</span> Solo el administrador master puede resetear contraseñas.
                  </p>
                </div>
              )}

              {/* Change Password Section */}
              <div className="border-t border-blue-200 dark:border-blue-700 pt-4 mt-4">
                {!showPasswordChange ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPasswordChange(true)}
                    className="w-full"
                  >
                    🔐 Cambiar Contraseña
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        {isChangingOwnPassword ? 'Contraseña Actual' : 'Nueva Contraseña'}
                      </label>
                      {isChangingOwnPassword && (
                        <Input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          placeholder="Ingresa tu contraseña actual"
                          disabled={isChangingPassword}
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Nueva Contraseña
                      </label>
                      <Input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        placeholder="Mínimo 6 caracteres"
                        disabled={isChangingPassword}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Confirmar Contraseña
                      </label>
                      <Input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Repite la nueva contraseña"
                        disabled={isChangingPassword}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          });
                        }}
                        disabled={isChangingPassword}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="flex-1"
                      >
                        {isChangingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-6 flex justify-end gap-3">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    nombre: user.nombre,
                    email: user.email,
                    telefono: user.telefono,
                    rol: user.rol,
                    vehiculo: user.vehiculo || '',
                    direccion: user.direccion || '',
                    codigo_postal: user.codigo_postal || '',
                    ciudad: user.ciudad || '',
                    pais: user.pais || 'ES',
                    activo: user.activo,
                  });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                Editar Usuario
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
