import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md mx-4 shadow-lg border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center mb-6">
            <AlertCircle className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
            <p className="mt-2 text-slate-600">
              The page you are looking for is not available or has been moved.
            </p>
          </div>

          <div className="bg-slate-100 p-4 rounded-md">
            <h2 className="text-lg font-medium text-slate-900 mb-2">Available Sections</h2>
            <ul className="list-disc pl-5 text-slate-700">
              <li className="mb-1"><Link href="/" className="text-primary hover:underline">Dashboard</Link></li>
              <li className="mb-1"><Link href="/documents" className="text-primary hover:underline">Documents</Link></li>
              <li className="mb-1"><Link href="/legal-research" className="text-primary hover:underline">Legal Research</Link></li>
              <li className="mb-1"><Link href="/document-drafting" className="text-primary hover:underline">Document Drafting</Link></li>
              <li className="mb-1"><Link href="/knowledge-base" className="text-primary hover:underline">Knowledge Base</Link></li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="justify-center space-x-4 pt-2 pb-6">
          <Link href="/">
            <Button className="flex gap-2">
              <Home className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} className="flex gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}