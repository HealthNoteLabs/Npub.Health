import { Card } from "@/components/ui/card";
import { useNostr } from "@/components/NostrProvider";
import Dashboard from "@/components/dashboard/Dashboard";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import ProfileBanner from "@/components/ui/ProfileBanner";

export default function DashboardPage() {
  const { publicKey, login } = useNostr();

  if (!publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <h1 className="text-3xl font-bold mb-6">Welcome to Npub.Health</h1>
          <p className="text-muted-foreground mb-6">
            Connect with your Nostr account to view your health metrics dashboard.
          </p>
          <Button onClick={login} size="lg">
            <LogIn className="mr-2 h-4 w-4" />
            Connect with Nostr
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <ProfileBanner className="mb-4" />
      <Dashboard />
    </div>
  );
}