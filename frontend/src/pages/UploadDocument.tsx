import React from 'react';
import DocumentUploader from '@/components/documents/DocumentUploader';
import { FileUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const UploadDocument: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href="/" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 flex items-center">
              <FileUp className="h-6 w-6 mr-2 text-slate-700" />
              Upload Document
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Upload documents for Invoice³ analysis and review
            </p>
          </div>
        </div>
        
        <div className="mx-auto max-w-3xl">
          <DocumentUploader />
          
          <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">Document Processing Features</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span>Automatic document parsing and extraction of key clauses and terms</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span>Invoice³ AI analysis identifies potential issues and provides intelligent insights</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span>Obligation extraction summarizes commitments and responsibilities</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">•</span>
                <span>Document comparison identifies differences between contract versions</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;
