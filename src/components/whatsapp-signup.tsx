'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Facebook } from 'lucide-react';

export function WhatsAppSignup() {
  const [isLoading, setIsLoading] = useState(false);

  // The meta app ID will be used when we enable this flow
  const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID;

  const handleSignup = () => {
    setIsLoading(true);
    // Placeholder for FB.login integration
    console.log('Initiating WhatsApp Embedded Signup Flow with App ID:', metaAppId);
    setTimeout(() => {
      setIsLoading(false);
      alert('WhatsApp embedded signup is currently disabled.');
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Business Registration</CardTitle>
        <CardDescription>
          Connect your WhatsApp Business account to enable AI auto-replies directly on WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleSignup} 
          disabled={true} // Disabled as per requirements
          className="w-full sm:w-auto"
        >
          <Facebook className="mr-2 h-4 w-4" />
          {isLoading ? 'Connecting...' : 'Connect with Meta'}
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          * This feature is currently disabled. Contact support if you need to register a new number.
        </p>
      </CardContent>
    </Card>
  );
}
