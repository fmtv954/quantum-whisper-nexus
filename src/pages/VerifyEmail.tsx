/**
 * Email verification page
 * Shown after signup when email confirmation is required
 */

import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function VerifyEmail() {
  const location = useLocation();
  const email = (location.state as any)?.email || "your email";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/50 text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="text-base">
            We've sent a verification link to <strong className="text-foreground">{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Click the link in the email to verify your account and get started.</p>
            <p>If you don't see the email, check your spam folder.</p>
          </div>

          <div className="pt-4">
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Back to login
              </Button>
            </Link>
          </div>

          <div className="text-xs text-muted-foreground">
            Didn't receive the email?{" "}
            <button className="text-primary hover:underline font-medium">
              Resend verification
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
