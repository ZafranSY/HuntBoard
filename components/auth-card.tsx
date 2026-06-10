"use client"

import { useActionState, useState } from "react"
import { createNamespace, login, type AuthState } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2 } from "lucide-react"

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <Button type="submit" className="w-full" size="lg">
      {children}
    </Button>
  )
}

export function AuthCard() {
  const [signupState, signupAction, signupPending] = useActionState<
    AuthState,
    FormData
  >(createNamespace, undefined)
  const [loginState, loginAction, loginPending] = useActionState<
    AuthState,
    FormData
  >(login, undefined)
  const [tab, setTab] = useState("login")

  return (
    <div className="w-full rounded-none border border-border bg-card p-6 shadow-none sm:p-8 relative overflow-hidden group">
      <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
      <Tabs value={tab} onValueChange={setTab} className="relative z-10">
        <TabsList className="grid w-full grid-cols-2 rounded-none border border-border bg-accent/30 p-0.5">
          <TabsTrigger value="login" className="rounded-none font-mono text-xs uppercase tracking-wider">Sign in</TabsTrigger>
          <TabsTrigger value="signup" className="rounded-none font-mono text-xs uppercase tracking-wider">Create board</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-6">
          <form action={loginAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-slug">Board name</Label>
              <Input
                id="login-slug"
                name="slug"
                placeholder="alex-codes"
                autoCapitalize="none"
                autoComplete="username"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-pin">PIN</Label>
              <Input
                id="login-pin"
                name="pin"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                autoComplete="current-password"
                required
              />
            </div>
            {loginState?.error && <FormError message={loginState.error} />}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loginPending}
            >
              {loginPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Open my board
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup" className="mt-6">
          <form action={signupAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-name">Your board name</Label>
              <Input
                id="signup-name"
                name="displayName"
                placeholder="Alex Codes"
                autoComplete="off"
                required
              />
              <p className="text-xs text-muted-foreground">
                Friends will find your board by this name.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-pin">Choose a PIN</Label>
              <Input
                id="signup-pin"
                name="pin"
                type="password"
                inputMode="numeric"
                placeholder="4-8 digits"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-confirm">Confirm PIN</Label>
              <Input
                id="signup-confirm"
                name="confirmPin"
                type="password"
                inputMode="numeric"
                placeholder="Repeat PIN"
                autoComplete="new-password"
                required
              />
            </div>
            {signupState?.error && <FormError message={signupState.error} />}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={signupPending}
            >
              {signupPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create my board
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FormError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-none border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-mono text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
