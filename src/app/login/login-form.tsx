"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_ACCOUNTS = [
  { label: "Fleet Manager", email: "manager@transitops.dev" },
  { label: "Dispatcher", email: "dispatcher@transitops.dev" },
  { label: "Safety Officer", email: "safety@transitops.dev" },
  { label: "Financial Analyst", email: "finance@transitops.dev" },
];
const DEMO_PASSWORD = "demo1234";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    { error: "" },
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Use a demo account below or enter credentials.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="you@transitops.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {state.error ? (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Quick demo login
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <Button
              key={acc.email}
              type="button"
              variant="outline"
              className="justify-start text-xs"
              onClick={() => {
                setEmail(acc.email);
                setPassword(DEMO_PASSWORD);
              }}
            >
              {acc.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
