import { WhatsAppCloudConnect } from '@/components/whatsapp-cloud-connect';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div>
        <h3 className="text-2xl font-medium leading-6 text-foreground">Settings</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your WhatsApp Business account via the Cloud API and manage platform settings.
        </p>
      </div>
      <Separator />
      
      <div className="space-y-6">
        <WhatsAppCloudConnect />
      </div>
    </div>
  );
}
