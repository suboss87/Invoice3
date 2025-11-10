import { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Invoice³ - AI-Powered Invoice Processing</h1>
          <nav className="mt-2">
            <a href="/" className="mr-4 text-blue-600 hover:text-blue-800">Dashboard</a>
            <a href="/upload" className="text-blue-600 hover:text-blue-800">Upload Invoice</a>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4">
        {children}
      </main>
    </div>
  );
}
