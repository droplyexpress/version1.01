import { useState, useRef } from "react";
import { useCreateUser } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/types";
import { generatePassword } from "@/lib/auth-utils";
import { supabase } from "@/lib/supabase";
import { Copy, Eye, EyeOff, Loader2 } from "lucide-react";

interface CreateUserFormProps {
  onSuccess?: () => void;
}

const roleOptions = [
  { value: "cliente", label: "Cliente" },
  { value: "repartidor", label: "Repartidor" },
  { value: "admin", label: "Administrador" },
];

const vehicleTypes = ["Bicicleta", "Moto", "Coche", "Furgoneta", "Camión"];

const countryOptions = [
  { value: "ES", label: "España" },
  { value: "MX", label: "México" },
  { value: "AR", label: "Argentina" },
  { value: "CO", label: "Colombia" },
  { value: "CL", label: "Chile" },
  { value: "PE", label: "Perú" },
];

interface GeneratedCredentials {
  email: string;
  password: string;
  nombre: string;
  rol: string;
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const { toast } = useToast();
  const createUserMutation = useCreateUser();

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    rol: "cliente" as const,
    vehiculo: "",
    // Client address fields (padron)
    direccion: "",
    codigo_postal: "",
    ciudad: "",
    pais: "ES",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedCredentials, setGeneratedCredentials] =
    useState<GeneratedCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingAuth, setIsCreatingAuth] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePostalCodeChange = (postalCode: string) => {
    setFormData({ ...formData, codigo_postal: postalCode });

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for search after user stops typing
    if (postalCode.length >= 3) {
      setSearchingAddress(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const result = await searchAddressByPostalCode(
            postalCode,
            formData.pais,
          );
          if (result) {
            setFormData((prev) => ({
              ...prev,
              codigo_postal: result.postalCode,
              direccion: result.address,
              ciudad: result.city,
            }));
            toast({
              title: "Dirección encontrada",
              description: `${result.address}, ${result.city}`,
              duration: 2000,
            });
          }
        } catch (error) {
          console.error("Error searching address:", error);
        } finally {
          setSearchingAddress(false);
        }
      }, 800);
    } else {
      setSearchingAddress(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) newErrors.nombre = "Nombre requerido";
    if (!formData.email.trim()) newErrors.email = "Email requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    if (!formData.telefono.trim()) newErrors.telefono = "Teléfono requerido";

    // Validate client-specific fields
    if (formData.rol === "cliente") {
      if (!formData.direccion.trim())
        newErrors.direccion = "Dirección requerida para clientes";
      if (!formData.codigo_postal.trim())
        newErrors.codigo_postal = "Código postal requerido";
      if (!formData.ciudad.trim()) newErrors.ciudad = "Ciudad requerida";
    }

    if (formData.rol === "repartidor" && !formData.vehiculo) {
      newErrors.vehiculo = "Vehículo requerido para repartidores";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsCreatingAuth(true);
    try {
      // Generate password
      const password = generatePassword();

      // Create user and profile via backend (single call with service key)
      console.log(
        "[CreateUserForm] Creating user via backend for:",
        formData.email,
      );

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Prepare user data for backend
      const userData: any = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        rol: formData.rol,
        vehiculo: formData.rol === "repartidor" ? formData.vehiculo : null,
        activo: true,
      };

      // Add client-specific fields
      if (formData.rol === "cliente") {
        userData.direccion = formData.direccion;
        userData.codigo_postal = formData.codigo_postal;
        userData.ciudad = formData.ciudad;
        userData.pais = formData.pais;
      }

      try {
        const authCreateResponse = await fetch("/api/auth/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password,
            userData,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        let authData;
        try {
          authData = await authCreateResponse.json();
        } catch (parseError) {
          console.error(
            "[CreateUserForm] Failed to parse JSON response:",
            parseError,
          );
          console.error(
            "[CreateUserForm] Response status:",
            authCreateResponse.status,
          );
          throw new Error(
            `Server returned an error (${authCreateResponse.status})`,
          );
        }

        if (!authCreateResponse.ok) {
          throw new Error(authData.message || "Error al crear usuario");
        }

        console.log("[CreateUserForm] Backend response:", authData);

        if (!authData.success || !authData.userId) {
          throw new Error(authData.message || "No se pudo crear el usuario");
        }

        console.log(
          "[CreateUserForm] User created successfully with ID:",
          authData.userId,
        );
      } catch (error) {
        clearTimeout(timeout);
        console.error("[CreateUserForm] User creation error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Error al crear el usuario";
        throw new Error(errorMessage);
      }

      // Show generated credentials
      setGeneratedCredentials({
        email: formData.email,
        password,
        nombre: formData.nombre,
        rol: formData.rol,
      });

      toast({
        title: "Éxito",
        description: `${formData.nombre} creado correctamente con acceso al sistema. Comparte las credenciales de forma segura.`,
        duration: 4000,
      });

      console.log("[CreateUserForm] User creation completed successfully");

      // Don't reset form here - keep credentials modal visible
      // Form will be reset when user closes credentials modal
    } catch (error) {
      console.error("[CreateUserForm] Error during user creation:", error);

      const errorMessage =
        error instanceof Error ? error.message : "No se pudo crear el usuario";

      if (
        errorMessage.includes("already exists") ||
        errorMessage.includes("ya está registrado")
      ) {
        setErrors({ email: "Este email ya est�� registrado" });
      }

      console.error("[CreateUserForm] Showing error toast:", errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      console.log("[CreateUserForm] Resetting creating auth state");
      setIsCreatingAuth(false);
    }
  };

  const handleCopyPassword = () => {
    if (generatedCredentials?.password) {
      navigator.clipboard.writeText(generatedCredentials.password);
      toast({
        title: "Copiado",
        description: "Contraseña copiada al portapapeles",
        duration: 2000,
      });
    }
  };

  const handleCopyCredentials = () => {
    if (generatedCredentials) {
      const text = `Email: ${generatedCredentials.email}\nContraseña: ${generatedCredentials.password}`;
      navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: "Credenciales copiadas al portapapeles",
        duration: 2000,
      });
    }
  };

  const closeCredentialsModal = () => {
    // Reset form and close modal
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      rol: "cliente",
      vehiculo: "",
      direccion: "",
      codigo_postal: "",
      ciudad: "",
      pais: "ES",
    });
    setErrors({});
    setIsCreatingAuth(false);
    setGeneratedCredentials(null);
    // Call onSuccess only after user closes the credentials modal
    onSuccess?.();
  };

  // Show credentials modal
  if (generatedCredentials) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-green-200 dark:border-green-800">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Usuario Creado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Credenciales de acceso (no podrás verlas de nuevo)
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Email
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-slate-700">
                  <p className="text-slate-900 dark:text-white font-medium break-all text-sm">
                    {generatedCredentials.email}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCredentials.email);
                    toast({ title: "Copiado", duration: 1500 });
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Contraseña
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-slate-700 flex items-center justify-between">
                  <p className="text-slate-900 dark:text-white font-mono font-medium text-sm">
                    {showPassword
                      ? generatedCredentials.password
                      : "•".repeat(generatedCredentials.password.length)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPassword}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Rol
              </label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-slate-700">
                <p className="text-slate-900 dark:text-white font-medium text-sm">
                  {
                    roleOptions.find(
                      (r) => r.value === generatedCredentials.rol,
                    )?.label
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <span className="font-semibold">ℹ️ Próximos pasos:</span> Comparte
              el email y contraseña con el usuario para que inicie sesión en el
              sistema.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={closeCredentialsModal}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleCopyCredentials}
            >
              Copiar Todo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Información General
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Nombre Completo *
            </label>
            <Input
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="Juan García López"
              className={errors.nombre ? "border-red-500" : ""}
              disabled={isCreatingAuth}
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Email (será su login) *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              placeholder="juan@example.com"
              className={errors.email ? "border-red-500" : ""}
              disabled={isCreatingAuth}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Teléfono de Contacto *
            </label>
            <Input
              value={formData.telefono}
              onChange={(e) =>
                setFormData({ ...formData, telefono: e.target.value })
              }
              placeholder="+34 612 345 678"
              className={errors.telefono ? "border-red-500" : ""}
              disabled={isCreatingAuth}
            />
            {errors.telefono && (
              <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Rol del Usuario *
            </label>
            <select
              value={formData.rol}
              onChange={(e) =>
                setFormData({ ...formData, rol: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreatingAuth}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Vehículo (solo para repartidores) */}
          {formData.rol === "repartidor" && (
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Tipo de Vehículo *
              </label>
              <select
                value={formData.vehiculo}
                onChange={(e) =>
                  setFormData({ ...formData, vehiculo: e.target.value })
                }
                className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.vehiculo ? "border-red-500" : ""
                }`}
                disabled={isCreatingAuth}
              >
                <option value="">Seleccionar vehículo</option>
                {vehicleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.vehiculo && (
                <p className="text-red-500 text-sm mt-1">{errors.vehiculo}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Client Address Section (Padron) */}
      {formData.rol === "cliente" && (
        <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Dirección de Recogida (Padrón)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Esta será la dirección predeterminada para la recogida de pedidos
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Dirección Completa *{" "}
                {searchingAddress && (
                  <span className="text-xs text-blue-500 ml-1">
                    buscando...
                  </span>
                )}
              </label>
              <div className="relative">
                <Input
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  placeholder="Calle Principal 123, Apartamento 4B"
                  className={errors.direccion ? "border-red-500" : ""}
                  disabled={isCreatingAuth}
                />
                {searchingAddress && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ingresa el código postal y se buscará automáticamente, o escribe
                la dirección manualmente
              </p>
              {errors.direccion && (
                <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>
              )}
            </div>

            {/* Código Postal */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Código Postal *{" "}
                {searchingAddress && (
                  <span className="text-xs text-blue-500 ml-1">
                    buscando...
                  </span>
                )}
              </label>
              <div className="relative">
                <Input
                  value={formData.codigo_postal}
                  onChange={(e) => handlePostalCodeChange(e.target.value)}
                  placeholder="28001"
                  className={`${errors.codigo_postal ? "border-red-500" : ""}`}
                  disabled={isCreatingAuth}
                />
                {searchingAddress && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              {errors.codigo_postal && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.codigo_postal}
                </p>
              )}
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Ciudad *
              </label>
              <Input
                value={formData.ciudad}
                onChange={(e) =>
                  setFormData({ ...formData, ciudad: e.target.value })
                }
                placeholder="Madrid"
                className={errors.ciudad ? "border-red-500" : ""}
                disabled={isCreatingAuth}
              />
              {errors.ciudad && (
                <p className="text-red-500 text-sm mt-1">{errors.ciudad}</p>
              )}
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                País
              </label>
              <select
                value={formData.pais}
                onChange={(e) =>
                  setFormData({ ...formData, pais: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isCreatingAuth}
              >
                {countryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <Button type="submit" disabled={isCreatingAuth} className="w-full">
        {isCreatingAuth
          ? "Creando usuario con acceso..."
          : "Crear Usuario y Asignar Acceso"}
      </Button>
    </form>
  );
}
