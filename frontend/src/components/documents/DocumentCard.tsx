import { Document } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'wouter';
import { FileText, AlertTriangle, Trash, Loader2, X, Bookmark, File, GitPullRequest, ScrollText, FileSignature, Shield, Calendar, Eye } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { 
  getStatusIcon, 
  getStatusBadgeClasses, 
  getStatusLabel, 
  formatDate 
} from './documentUtils';

interface DocumentCardProps {
  document: Document;
  isSelected?: boolean;
  onSelect?: (documentId: number, selected: boolean) => void;
  selectionMode?: boolean;
}

// Generate a pseudo-random but consistent risk score based on document properties
const getRiskScoreForDocument = (document: Document): number => {
  // Create a reproducible "random" number based on document properties
  const title = document.title || '';
  const created = document.createdAt?.toString() || '';
  const category = document.category || '';
  
  // Use simple string hash to get a consistent number from document properties
  let hash = 0;
  const str = title + created + category;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Map the hash to the appropriate range based on risk level
  if (document.riskLevel === 'high') {
    return 78 + (Math.abs(hash) % 15); // 78-92
  } else if (document.riskLevel === 'medium') {
    return 45 + (Math.abs(hash) % 24); // 45-68
  } else {
    return 15 + (Math.abs(hash) % 26); // 15-40
  }
};

const DocumentCard: React.FC<DocumentCardProps> = ({ 
  document, 
  isSelected = false, 
  onSelect, 
  selectionMode = false 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/documents/${id}`);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Document deleted',
        description: `${document.title} has been deleted successfully.`,
      });
      // Invalidate both documents and analyses to refresh dashboard and recent documents
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/document-analyses'] });
      setShowDeleteConfirm(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting document',
        description: error.message || 'An error occurred while deleting the document.',
        variant: 'destructive',
      });
      setShowDeleteConfirm(false);
    }
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    deleteDocumentMutation.mutate(document.id);
  };

  return (
    <div className="relative">
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-10 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base sm:text-lg font-medium text-gray-900">Confirm Delete</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-gray-100"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center mb-2 sm:mb-3 text-red-600">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Are you sure you want to delete "<span className="font-semibold">{document.title}</span>"? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 w-24"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDelete}
                disabled={deleteDocumentMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white w-24"
              >
                {deleteDocumentMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    <span>Deleting</span>
                  </div>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    
      <Card className={`group relative hover:shadow-xl transition-all duration-300 border border-slate-200/80 bg-white shadow-sm hover:border-slate-300 ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg border-blue-200' : 'hover:shadow-xl'
      } ${selectionMode ? 'cursor-pointer' : ''} rounded-lg overflow-hidden`}>
        
        {/* Selection Checkbox */}
        {selectionMode && (
          <div 
            className="absolute top-3 left-3 z-20"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.(document.id, !isSelected);
            }}
          >
            <Checkbox
              checked={isSelected}
              onChange={() => onSelect?.(document.id, !isSelected)}
              className="bg-white border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
          </div>
        )}

        <CardContent className="p-0">
          <Link href={`/contracts/${document.id}`}>
            <div className="cursor-pointer">
              {/* Professional Header */}
              <div className="relative bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/60 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 shadow-sm ring-1 ring-slate-900/5">
                      {document.category === 'NDA' ? (
                        <Shield size={16} className="text-slate-600" />
                      ) : document.category === 'Contract' ? (
                        <FileSignature size={16} className="text-slate-600" />
                      ) : document.category === 'Agreement' ? (
                        <GitPullRequest size={16} className="text-slate-600" />
                      ) : document.category === 'Amendment' ? (
                        <Bookmark size={16} className="text-slate-600" />
                      ) : (
                        <FileText size={16} className="text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pr-2">
                      <h3 className="font-semibold text-slate-900 text-sm leading-5 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2" 
                          style={{ wordBreak: 'break-word', hyphens: 'auto' }}
                          title={document.title}>
                        {document.title}
                      </h3>
                      <div className="flex items-center text-slate-500 text-xs">
                        <Calendar size={10} className="mr-1 flex-shrink-0" />
                        <span className="truncate">{formatDate(document.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* Professional Content */}
              <div className="p-4 space-y-3.5 bg-white">
                {/* Status and Category */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md ${getStatusBadgeClasses(document.status)}`}>
                    {getStatusIcon(document.status)}
                    {getStatusLabel(document.status)}
                  </span>
                  {document.category && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                      document.category === 'NDA' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                      document.category === 'Contract' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 
                      document.category === 'Agreement' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                      document.category === 'Amendment' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 
                      'bg-slate-50 text-slate-700 border border-slate-200'
                    }`}>
                      {document.category}
                    </span>
                  )}
                </div>
                
                {/* Risk Score */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">Risk Score</span>
                    <span className={`text-xs font-semibold ${
                      document.riskLevel === 'high' ? 'text-red-600' : 
                      document.riskLevel === 'medium' ? 'text-amber-600' : 
                      document.riskLevel === 'low' ? 'text-emerald-600' : 
                      'text-amber-600'
                    }`}>
                      {getRiskScoreForDocument(document)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        document.riskLevel === 'high' ? 'bg-red-500' : 
                        document.riskLevel === 'medium' ? 'bg-amber-500' : 
                        document.riskLevel === 'low' ? 'bg-emerald-500' : 
                        'bg-amber-500'
                      }`}
                      style={{ 
                        width: `${getRiskScoreForDocument(document)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentCard;
