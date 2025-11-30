export interface MigrationResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface AdminUserResult {
  success: boolean;
  message: string;
  userId?: string;
  email?: string;
}

export interface SetupResult {
  success: boolean;
  migration: MigrationResult;
  admin: AdminUserResult;
}

/**
 * Execute database migration to add address fields to usuarios table
 */
export async function executeMigration(): Promise<MigrationResult> {
  try {
    const response = await fetch('/api/migration/execute-migration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to execute migration',
    };
  }
}

/**
 * Create or update admin user
 */
export async function createAdmin(
  email: string,
  password: string,
  name?: string
): Promise<AdminUserResult> {
  try {
    const response = await fetch('/api/migration/create-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create admin user',
    };
  }
}

/**
 * Execute complete setup: migration + admin user creation
 */
export async function executeSetup(
  email: string,
  password: string,
  name?: string
): Promise<SetupResult> {
  try {
    const response = await fetch('/api/migration/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      migration: {
        success: false,
        message: error instanceof Error ? error.message : 'Setup failed',
      },
      admin: {
        success: false,
        message: error instanceof Error ? error.message : 'Setup failed',
      },
    };
  }
}
