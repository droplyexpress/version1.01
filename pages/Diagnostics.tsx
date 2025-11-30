import { useState } from "react";
import { testSupabaseConnection } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Loader, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DiagnosticsPage() {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [envVars, setEnvVars] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsLoading(true);

    // Test Supabase connection
    const result = await testSupabaseConnection();
    setTestResults(result);

    // Show environment info
    setEnvVars({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "Not set",
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      env: import.meta.env.MODE,
    });

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Diagnostics</CardTitle>
            <CardDescription>
              Test Supabase connection and view configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Environment Variables */}
            {envVars && (
              <div>
                <h3 className="font-semibold mb-3">
                  Environment Configuration
                </h3>
                <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
                  <div>
                    <span className="text-muted-foreground">Supabase URL:</span>{" "}
                    {envVars.supabaseUrl}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Anon Key Set:</span>{" "}
                    {envVars.hasAnonKey ? "✓ Yes" : "✗ No"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mode:</span>{" "}
                    {envVars.env}
                  </div>
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResults && (
              <div>
                <h3 className="font-semibold mb-3">Connection Test Results</h3>
                {testResults.connected ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-900">Success</AlertTitle>
                    <AlertDescription className="text-green-800">
                      {testResults.message}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-900">
                        Connection Failed
                      </AlertTitle>
                      <AlertDescription className="text-red-800">
                        {testResults.error}
                      </AlertDescription>
                    </Alert>

                    {testResults.details && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-2">
                          Test Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              URL Accessible:
                            </span>
                            <span
                              className={
                                testResults.details.url_accessible
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {testResults.details.url_accessible
                                ? "✓ Yes"
                                : "✗ No"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Database Accessible:
                            </span>
                            <span
                              className={
                                testResults.details.database_accessible
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {testResults.details.database_accessible
                                ? "✓ Yes"
                                : "✗ No"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tables Exist:</span>
                            <span
                              className={
                                testResults.details.tables_exist
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {testResults.details.tables_exist
                                ? "✓ Yes"
                                : "✗ No"}
                            </span>
                          </div>
                        </div>

                        {testResults.details.errors &&
                          testResults.details.errors.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <h5 className="font-semibold text-sm mb-2">
                                Errors Found:
                              </h5>
                              <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                                {testResults.details.errors.map(
                                  (error: string, idx: number) => (
                                    <li key={idx}>{error}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Test Button */}
            <Button
              onClick={runDiagnostics}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader className="h-4 w-4 mr-2 animate-spin" />}
              {isLoading ? "Running Diagnostics..." : "Run Diagnostics"}
            </Button>

            {/* Troubleshooting */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">
                Troubleshooting Steps
              </h4>
              <div className="text-sm text-blue-800 space-y-3">
                <div>
                  <p className="font-semibold mb-1">
                    1. Verify Supabase Database Tables
                  </p>
                  <p className="text-xs text-blue-700 ml-4">
                    Go to your Supabase Dashboard → SQL Editor and run:
                  </p>
                  <code className="bg-white p-2 rounded text-xs block mt-1 ml-4 font-mono">
                    SELECT table_name FROM information_schema.tables WHERE
                    table_schema = 'public';
                  </code>
                </div>

                <div>
                  <p className="font-semibold mb-1">
                    2. Create Required Tables
                  </p>
                  <p className="text-xs text-blue-700 ml-4">
                    If tables don't exist, refer to SUPABASE_SETUP.md or
                    SETUP_USUARIOS_COMPLETO.md
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">
                    3. Check Row Level Security (RLS)
                  </p>
                  <p className="text-xs text-blue-700 ml-4">
                    Go to Supabase Dashboard → Authentication → Policies and
                    ensure:
                  </p>
                  <ul className="list-disc list-inside text-xs text-blue-700 ml-4 mt-1">
                    <li>RLS is enabled on all tables</li>
                    <li>Public read/write policies are set for development</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold mb-1">4. Check Browser Console</p>
                  <p className="text-xs text-blue-700 ml-4">
                    Press F12 → Console tab to view detailed error messages
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">
                    5. Verify Environment Variables
                  </p>
                  <p className="text-xs text-blue-700 ml-4">
                    Ensure .env.local has both VITE_SUPABASE_URL and
                    VITE_SUPABASE_ANON_KEY set
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1">
                    6. Check Network Connectivity
                  </p>
                  <p className="text-xs text-blue-700 ml-4">
                    If running on a deployed server (Fly.io, etc), verify:
                  </p>
                  <ul className="list-disc list-inside text-xs text-blue-700 ml-4 mt-1">
                    <li>The server can reach Supabase domain</li>
                    <li>No firewall blocking the connection</li>
                    <li>CORS is properly configured in Supabase</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
