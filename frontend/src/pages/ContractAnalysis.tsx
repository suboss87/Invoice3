import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import AppLayout from '@/components/layout/AppLayout';
import { fetchDocument, fetchDocumentAnalysisByDocument, analyzeDocument } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Download, Sparkles, UsersRound, X, FileText } from 'lucide-react';
import DocumentComparisonView from '@/components/documents/DocumentComparisonView';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
// import AIAnalysisOptionsCard from '@/components/documents/AIAnalysisOptionsCard';
// import PreAnalysisSetupCard from '@/components/documents/PreAnalysisSetupCard';

const ContractAnalysis: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const documentId = parseInt(id);
  const { toast } = useToast();
  const [documentTitle, setDocumentTitle] = useState('Contract Analysis');
  const [showPreAnalysisSetup, setShowPreAnalysisSetup] = useState(false);
  const [showAnalysisOptions, setShowAnalysisOptions] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Pre-analysis context state
  const [preAnalysisContext, setPreAnalysisContext] = useState({
    contractType: '',
    perspective: '',
    industry: ''
  });
  // Clause finding options state
  const [analysisOptions, setAnalysisOptions] = useState({
    findLiabilityLimitations: true,
    findIndemnificationClauses: true,
    findTerminationProvisions: false,
    findPaymentTerms: false,
    findIPOwnershipClauses: false,
    findConfidentialityScope: false,
    findGoverningLawClauses: false,
    findForceMajeureClauses: false
  });

  // Fetch document details
  const { 
    data: document, 
    isLoading: isLoadingDocument,
    isError: isDocumentError
  } = useQuery({
    queryKey: [`/api/documents/${documentId}`],
    queryFn: () => fetchDocument(documentId),
    enabled: !isNaN(documentId)
  });

  // Fetch document analysis if it exists
  const { 
    data: analysis, 
    isLoading: isLoadingAnalysis 
  } = useQuery({
    queryKey: [`/api/documents/${documentId}/analysis`],
    queryFn: () => fetchDocumentAnalysisByDocument(documentId),
    enabled: !isNaN(documentId),
    retry: false,
    refetchOnWindowFocus: false
  });

  // Update document title when document is loaded
  useEffect(() => {
    if (document) {
      setDocumentTitle(document.title);
    }
  }, [document]);

  // Mutation for analyzing a document with model selection
  const analyzeMutation = useMutation({
    mutationFn: (documentId: number) => analyzeDocument(documentId),
    onSuccess: () => {
      toast({
        title: "Analysis started",
        description: "The document is being analyzed using AI. This may take a few moments.",
      });
      // Refetch the analysis data
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/analysis`] });
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: `There was a problem analyzing the document: ${String(error)}`,
        variant: "destructive",
      });
    }
  });

  const handleAnalyzeOptionsClick = () => {
    setShowPreAnalysisSetup(true);
  };

  const handlePreAnalysisComplete = () => {
    setShowPreAnalysisSetup(false);
    setShowAnalysisOptions(true);
  };

  const handlePreAnalysisCancel = () => {
    setShowPreAnalysisSetup(false);
  };

  const handleOptionChange = (key: string, value: boolean) => {
    setAnalysisOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAnalyze = () => {
    if (isNaN(documentId)) return;
    // Close the options panel
    setShowAnalysisOptions(false);
    // The model provider is already included in the mutation function
    analyzeMutation.mutate(documentId);
  };
  
  const handleCancelAnalysis = () => {
    setShowAnalysisOptions(false);
  };
  
  // Handle showing export options modal
  const handleExportReport = () => {
    setShowExportOptions(true);
  };
  
  // Handle specific export format 
  const handleExportFormat = (format: string) => {
    setShowExportOptions(false);
    
    toast({
      title: `Exporting as ${format}`,
      description: "Your report is being generated and will download shortly."
    });
    
    // Simulate export completion
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: `${documentTitle} analysis has been exported as ${format}.`
      });
    }, 2000);
  };
  
  // Handle cancel export
  const handleCancelExport = () => {
    setShowExportOptions(false);
  };


  // Loading state while fetching document
  if (isLoadingDocument) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }

  // Error state if document not found
  if (isDocumentError || !document) {
    return (
      <div className="flex flex-col justify-center items-center p-12">
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Document Not Found</h2>
        <p className="text-slate-600 mb-4">The requested document could not be found or you don't have permission to view it.</p>
        <Button 
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{document.title}</h1>
        <div className="flex space-x-2">
          <Link href={`/collaborative-editor/${documentId}`}>
            <Button variant="outline" size="sm" className="text-sm hidden md:flex">
              <UsersRound className="mr-1.5 h-3.5 w-3.5" /> Collaborate
            </Button>
          </Link>

          <Button 
            size="sm" 
            onClick={handleAnalyzeOptionsClick}
            disabled={analyzeMutation.isPending}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </div>
      
      {/* Pre-Analysis Setup Modal */}
      {/* Pre-Analysis Setup - component not available
      {showPreAnalysisSetup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="text-center text-white">Pre-analysis setup unavailable</div>
        </div>
      )}
      */}

      {/* Invoice³ Analysis Options - component not available
      {showAnalysisOptions && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="text-center text-white">Analysis options unavailable</div>
        </div>
      )}
      */}
      
      {/* Export Options Modal */}
      {showExportOptions && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="max-w-md w-full mx-auto">
            <Card className="border border-slate-200 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-50 text-blue-600 p-1.5 rounded-md">
                      <Download className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-md font-medium">Export Report</CardTitle>
                      <CardDescription className="text-xs">Export document analysis in your preferred format</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCancelExport} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" className="text-xs h-9 justify-start" onClick={() => handleExportFormat('PDF')}>
                    <Download className="h-3.5 w-3.5 mr-1.5 text-red-600" />
                    PDF Report
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-9 justify-start" onClick={() => handleExportFormat('DOCX')}>
                    <Download className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                    Word Document
                  </Button>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-slate-500 font-medium mb-2">Analysis Data Export</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="text-xs h-9 justify-start" onClick={() => handleExportFormat('XLSX')}>
                      <Download className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                      Excel Spreadsheet
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-9 justify-start" onClick={() => handleExportFormat('CSV')}>
                      <Download className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
                      CSV Data
                    </Button>
                  </div>
                </div>
              </CardContent>
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 rounded-b-lg">
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleCancelExport}>
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      <Card className="border border-slate-200">
        <CardHeader className="px-6 py-4 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle className="text-lg font-medium">Analysis Results</CardTitle>
            <div className="flex items-center space-x-2">
              {/* Model selector removed as per system design */}
              
              <span className={`px-2.5 py-1 text-xs rounded-full ${
                document.status === 'high_risk' ? 'bg-red-100 text-red-800' : 
                document.status === 'needs_review' ? 'bg-amber-100 text-amber-800' :
                document.status === 'reviewed' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {document.status ? document.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Pending'}
              </span>
              <span className="text-sm text-slate-500">
                {new Date(document.createdAt || new Date()).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="analysis" className="w-full">
            <div className="mx-6 mt-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-md">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Document Analysis</span>
              </div>
            </div>
            
            <TabsContent value="analysis" className="mt-0">
              <DocumentComparisonView 
                document={document} 
                analysis={analysis || null} 
                isLoading={isLoadingAnalysis || analyzeMutation.isPending}
                onAnalyze={handleAnalyzeOptionsClick}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractAnalysis;
