import { SignIn, UserButton, Show } from "@clerk/nextjs";


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground">
      <Show when="signed-out">
        <SignIn routing="hash" />
      </Show>
      <Show when="signed-in">
        <div className="flex flex-col items-center gap-4 p-8 rounded-xl border border-border bg-card shadow-sm text-center">
          <h2 className="text-xl font-bold">Signed In</h2>
          <UserButton showName />
        </div>
      </Show>
    </main>
  );
}
