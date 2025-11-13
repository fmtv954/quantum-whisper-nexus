/**
 * Lead Capture Modal
 * Collects email, name, and consent before starting a call
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone } from "lucide-react";

interface LeadCaptureModalProps {
  open: boolean;
  onSubmit: (data: { email: string; name?: string; consent: boolean }) => void;
  onCancel: () => void;
  campaignName: string;
}

export function LeadCaptureModal({
  open,
  onSubmit,
  onCancel,
  campaignName,
}: LeadCaptureModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = () => {
    if (!validateEmail(email)) return;
    if (!consent) return;

    onSubmit({
      email: email.trim(),
      name: name.trim() || undefined,
      consent,
    });

    // Reset form
    setEmail("");
    setName("");
    setConsent(false);
    setEmailError("");
  };

  const isValid = email.trim() && consent && !emailError;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Start Your Call
          </DialogTitle>
          <DialogDescription>
            Please provide your contact information to begin your conversation with {campaignName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={() => validateEmail(email)}
              className={emailError ? "border-destructive" : ""}
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked === true)}
            />
            <Label
              htmlFor="consent"
              className="text-sm leading-relaxed cursor-pointer"
            >
              I agree to be contacted regarding this inquiry and consent to the
              recording of this call for quality and training purposes.{" "}
              <span className="text-destructive">*</span>
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            <Phone className="mr-2 h-4 w-4" />
            Start Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
