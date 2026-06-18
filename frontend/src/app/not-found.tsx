'use client';

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-4 text-base text-muted-foreground">The page you are looking for does not exist.</p>
      <a href="/" className="mt-6 rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
        Go back home
      </a>
    </main>
  );
}
