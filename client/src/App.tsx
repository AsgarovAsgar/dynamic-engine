import { ThemeToggle } from '@/theme/ThemeToggle';

/** Replaced by the workspace shell once the dashboard stream lands. */
export default function App() {
  return (
    <div className="min-h-svh bg-canvas p-8">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight text-content">
          Dynamic Engine
        </h1>
        <ThemeToggle />
      </header>
    </div>
  );
}
