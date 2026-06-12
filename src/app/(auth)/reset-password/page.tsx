import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

// Requires a session: the recovery email link goes through /auth/callback,
// which exchanges the code and lands here. proxy.ts gates the route.
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
