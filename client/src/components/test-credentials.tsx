import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

/**
 * This component displays test credentials for automated testing
 * It's intended to be shown only in development mode
 */
export function TestCredentials() {
  const { loginMutation } = useAuth();
  
  const handleAutoLogin = () => {
    loginMutation.mutate({
      username: 'test_user',
      password: 'test_password'
    });
  };
  
  // Only show in development mode
  if (import.meta.env.PROD) {
    return null;
  }
  
  return (
    <Card className="mb-4 border-amber-500 dark:border-amber-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-amber-600 dark:text-amber-400">Test Account Credentials</CardTitle>
        <CardDescription>Use these credentials for testing the application</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Username:</span> test_user
          </div>
          <div>
            <span className="font-semibold">Password:</span> test_password
          </div>
          <Button 
            variant="outline" 
            onClick={handleAutoLogin}
            disabled={loginMutation.isPending}
            className="mt-2"
          >
            {loginMutation.isPending ? 'Logging in...' : 'Auto-Login'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}