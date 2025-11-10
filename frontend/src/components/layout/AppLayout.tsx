import { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <a href="/" className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              Invoice³ - AI-Powered Invoice Processing
            </a>
            <nav className="flex space-x-4">
              <a href="/settings" className="text-gray-600 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Settings
              </a>
              <a href="/analytics" className="text-gray-600 hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Analytics
              </a>
            </nav>
          </div>
          </div>
        </header>
      <main className="max-w-7xl mx-auto py-6 px-4">
          {children}
        </main>
    </div>
  );
}