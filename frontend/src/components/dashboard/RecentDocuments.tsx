import React from 'react';
import { Link } from 'wouter';
import { File, Upload } from 'lucide-react';
import { Document } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RecentDocumentsProps {
  documents: Document[];
  isLoading?: boolean;
}

const formatTimeAgo = (date: string | Date) => {
  const now = new Date();
  const documentDate = new Date(date);
  const diffInHours = Math.floor((now.getTime() - documentDate.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
};

const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case 'needs_review':
      return 'bg-amber-100 text-amber-800';
    case 'high_risk':
      return 'bg-red-100 text-red-800';
    case 'reviewed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'needs_review':
      return 'Needs Review';
    case 'high_risk':
      return 'High Risk';
    case 'reviewed':
      return 'Reviewed';
    case 'in_progress':
      return 'In Progress';
    case 'draft':
      return 'Draft';
    case 'approved':
      return 'Approved';
    default:
      return status.replace('_', ' ');
  }
};

const RecentDocuments: React.FC<RecentDocumentsProps> = ({ documents, isLoading = false }) => {
  return (
    <Card className="h-full">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-semibold text-[#1a365d]">Recent Documents</h2>
        <Link href="/documents" className="text-sm text-[#4a6fa5] hover:text-[#5d7fb5]">
          View All
        </Link>
      </div>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <File className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">No documents found</p>
          </div>
        ) : (
          <div>
            {documents.map((doc) => (
              <div key={doc.id} className="mb-4 last:mb-0 p-4 border border-gray-200 hover:border-[#4a6fa5] rounded-lg cursor-pointer">
                <div className="flex items-start">
                  <div className="mr-3 text-gray-400">
                    <File className="text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-[#1a365d]">{doc.title}</h3>
                      <span className="text-xs text-gray-500">{formatTimeAgo(doc.updatedAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                    <div className="mt-2 flex items-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClasses(doc.status)}`}>
                        {getStatusLabel(doc.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <Button asChild className="w-full py-2 bg-[#1a365d] hover:bg-[#2a4a7f] text-white rounded-md flex items-center justify-center">
          <Link href="/upload-document">
            <Upload className="mr-2 h-4 w-4" />
            <span>Upload New Document</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RecentDocuments;
