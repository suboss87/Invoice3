import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X, SparklesIcon, Loader2, LibraryIcon, BookIcon } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { createDocument, analyzeDocument } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  SAMPLE_NDA, 
  SAMPLE_SAAS_AGREEMENT, 
  SAMPLE_EMPLOYMENT_CONTRACT, 
  SAMPLE_MASTER_SERVICES, 
  SAMPLE_REAL_ESTATE, 
  SAMPLE_IP_LICENSE,
  DOCUMENT_TEMPLATES
} from '@/lib/sampleData';

const DocumentUploader: React.FC = () => {
  const { toast } = useToast();
  const { user } = useUser();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('upload');

  const [documentData, setDocumentData] = useState({
    title: '',
    description: '',
    type: 'Contract',
    category: 'Services',
    content: '',
  });

  
  // Using integrated options now, no need for separate options page

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processProgress, setProcessProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<number | null>(null);
  const [showAnalysisButton, setShowAnalysisButton] = useState(false);

  // Mutation for creating a document
  const documentMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: (createdDocument) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      // Set the document ID for analysis
      setUploadedDocumentId(createdDocument.id);
      
      toast({
        title: "Document uploaded successfully",
        description: "Document is ready for analysis. Click Start Analysis to begin.",
      });
      
      // Keep user on the same page but update UI to show analysis button
      setIsProcessing(false);
      setShowAnalysisButton(true);
    },
    onError: (error: any) => {
      console.error("Document upload error:", error);
      
      // Check if this is an invalid document type error
      const errorMessage = String(error);
      if (errorMessage.includes("Invalid document type")) {
        toast({
          title: "Invalid Document Type",
          description: "Invoice³ processes various document types including invoices, receipts, and business documents.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload failed",
          description: `There was an error uploading your document: ${errorMessage}`,
          variant: "destructive",
        });
      }
      setIsProcessing(false);
    }
  });

  // Mutation for analyzing a document with AI
  const analysisMutation = useMutation({
    mutationFn: analyzeDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-analyses'] });
      
      toast({
        title: "Analysis complete",
        description: "The document has been analyzed successfully.",
      });
      
      setIsProcessing(false);
      
      // Navigate to the correct analysis route if we have the document ID
      if (data && data.documentId) {
        navigate(`/contracts/${data.documentId}`);
      } else {
        navigate('/documents');
      }
    },
    onError: (error: any) => {
      console.error("Analysis error:", error);
      toast({
        title: "Invoice³ Analysis Failed",
        description: `There was an error during document analysis. Please try again or contact support if the issue persists.`,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDocumentData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setDocumentData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Extract filename for title suggestion
      const filename = file.name.replace(/\.(pdf|doc|docx|txt)$/i, '');
      
      setDocumentData(prev => ({
        ...prev,
        title: filename
      }));
      
      // Real file reading for text extraction
      const reader = new FileReader();
      
      // Define file type variables up front before we use them
      const isPdf = file.type === 'application/pdf';
      const isWordDoc = file.type === 'application/msword' || 
                        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isPlainText = file.type === 'text/plain' || 
                          file.type === 'text/markdown' || 
                          file.name.endsWith('.md') || 
                          file.name.endsWith('.txt');
      const isRichText = file.type === 'application/rtf' || 
                        file.name.endsWith('.rtf');
      const isOtherDoc = file.type === 'application/vnd.oasis.opendocument.text' || 
                        file.name.endsWith('.odt') || 
                        file.name.endsWith('.pages');
      
      reader.onload = (e) => {
        let content = e.target?.result as string;
        
        // Production-grade text extraction with enhanced error handling
        // While server-side extraction would be better, we maximize client-side capabilities
        if (isPdf || isWordDoc || isRichText || isOtherDoc) {
          try {
            // For binary files, attempt to extract text with comprehensive error handling
            if (typeof content !== 'string') {
              // Convert binary to string, extracting any potential text
              const textDecoder = new TextDecoder();
              content = textDecoder.decode(new Uint8Array(content as ArrayBuffer));
              
              // Additional processing for binary formats to improve extraction quality
              content = content.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
                              .replace(/\u0000/g, '') // Remove null bytes
                              .replace(/[\r\n]{3,}/g, '\n\n') // Normalize excessive newlines
                              .trim();
            }
            
            // Advanced quality check with better user feedback
            if (!content || content.trim().length < 50) {
              // Try to extract at least some content instead of failing completely
              if (content && content.trim().length > 0) {
                toast({
                  title: "Partial Text Extraction",
                  description: "We extracted some text, but it may be incomplete. Please review and edit the content as needed.",
                  variant: "default",
                });
              } else {
                toast({
                  title: "Text Extraction Limited",
                  description: "We couldn't extract text from this document type. Please paste the document content manually in the text area below.",
                  variant: "destructive",
                });
                // Set a helpful prompt instead of failing silently
                content = "// Please paste your document content here.\n// Common formats supported: Plain text, Markdown, and partial support for PDF/Word.\n\n";
              }
            } else {
              toast({
                title: "Document Processed",
                description: "Content extracted successfully. Review and make any necessary edits before proceeding.",
              });
            }
          } catch (error) {
            console.error("Error extracting text from file:", error);
            toast({
              title: "Document Processing Issue",
              description: "We encountered a problem extracting text from this file. Please paste the document content manually below.",
              variant: "destructive",
            });
            
            // Set a placeholder message with clear instructions
            content = "// Document extraction encountered an error.\n// Please paste your document content here manually.\n// For better results with complex documents, consider using plain text format.\n\n";
          }
        }
        
        // Set the content in the document data
        setDocumentData(prev => ({
          ...prev,
          content: content || "Error reading file content. Please enter document content manually."
        }));
      };
      
      reader.onerror = () => {
        toast({
          title: "File Reading Error",
          description: "There was a problem reading the file. Please try again or enter content manually.",
          variant: "destructive",
        });
      };
      
      // File type variables already defined above, don't redeclare
                      
      // Use appropriate reading method based on file type
      if (isPlainText) {
        // For plain text files, just read as text
        reader.readAsText(file);
      } else if (isPdf || isWordDoc || isRichText || isOtherDoc) {
        // For PDFs/Word docs, we'd normally use server-side parsing
        // Try both reading methods to maximize chances of getting content
        try {
          // First try as ArrayBuffer for binary files
          reader.readAsArrayBuffer(file);
        } catch (error) {
          console.error("Error reading file as ArrayBuffer, falling back to text:", error);
          // Fall back to text mode if ArrayBuffer fails
          reader.readAsText(file);
        }
      } else {
        // Default to text reading for other types
        reader.readAsText(file);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to upload documents.",
        variant: "destructive",
      });
      return;
    }

    if (!documentData.content && !selectedFile) {
      toast({
        title: "No document content",
        description: "Please upload a file or enter document content.",
        variant: "destructive",
      });
      return;
    }

    // Always process document with selected options
    uploadDocument();
  };
  
  const uploadDocument = () => {
    setIsProcessing(true);
    simulateProgress();
    
    // Create the document
    if (user) {
      documentMutation.mutate({
        ...documentData,
        createdBy: user.id,
        status: 'needs_review',
        tags: [],
      });
    } else {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to upload documents.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const startDocumentAnalysis = (documentId: number) => {
    // Start the Invoice³ analysis
    console.log("Starting analysis for document ID:", documentId);
    
    // Add a loading toast to show the analysis is in progress
    toast({
      title: "Analysis in progress",
      description: "Analyzing your document. This may take up to 60 seconds depending on document length.",
      duration: 10000,
    });
    
    // Call the analysis API with explicit error handling
    analyzeDocument(documentId)
      .then(data => {
        console.log("Analysis completed successfully:", data);
        
        // Ensure data cache is refreshed
        queryClient.invalidateQueries({ queryKey: ['/api/document-analyses'] });
        queryClient.invalidateQueries({ queryKey: [`/api/documents/${documentId}/analysis`] });
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
        
        toast({
          title: "Analysis complete",
          description: "Your document has been successfully analyzed. You can now review the analysis.",
          duration: 5000,
        });
        
        setIsProcessing(false);
        setProcessProgress(100);
        
        // Navigate to analysis page
        setTimeout(() => {
          navigate(`/contracts/${documentId}`);
        }, 500);
      })
      .catch(error => {
        console.error("Analysis error:", error);
        
        // More user-friendly error message
        toast({
          title: "Analysis failed",
          description: "We encountered an issue while analyzing your document. Please try again or contact support if the problem persists.",
          variant: "destructive",
          duration: 7000,
        });
        
        setIsProcessing(false);
        setProcessProgress(0);
      });
  };
  
  
  // Direct analysis with options selected in the integrated interface
  const handleStartAnalysis = () => {
    if (uploadedDocumentId) {
      setIsProcessing(true);
      simulateProgress();
      startDocumentAnalysis(uploadedDocumentId);
    }
  };

  // Simulate progress updates for the upload/processing
  const simulateProgress = () => {
    setProcessProgress(0);
    const interval = setInterval(() => {
      setProcessProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 300);
  };

  // Function to load a specific template based on template ID
  const loadTemplate = (templateId: number) => {
    const template = DOCUMENT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setDocumentData(prev => ({
        ...prev,
        title: template.title,
        description: template.description,
        type: template.category.includes("Non-Disclosure") ? "NDA" : 
               template.category.includes("Employment") ? "Employment" :
               "Contract",
        category: template.category,
        content: template.content
      }));
      setActiveTab('content');
    }
  };

  // Legacy function kept for backward compatibility
  const loadSampleContract = () => {
    loadTemplate(1); // Load the NDA template by default
  };

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardContent className="p-6">
          <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="upload">File Upload</TabsTrigger>
              <TabsTrigger value="content">Document Content</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title <span className="text-red-500">*</span></Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="Enter title" 
                    value={documentData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Document Type</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('type', value)}
                    value={documentData.type}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Service Agreement">Service Agreement</SelectItem>
                      <SelectItem value="NDA">Non-Disclosure Agreement</SelectItem>
                      <SelectItem value="Employment">Employment Contract</SelectItem>
                      <SelectItem value="Partnership">Partnership Agreement</SelectItem>
                      <SelectItem value="Lease">Lease Agreement</SelectItem>
                      <SelectItem value="License">License Agreement</SelectItem>
                      <SelectItem value="Sales">Sales Contract</SelectItem>
                      <SelectItem value="Purchase">Purchase Agreement</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('category', value)}
                    value={documentData.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Services">Services</SelectItem>
                      <SelectItem value="Non-Disclosure">Non-Disclosure</SelectItem>
                      <SelectItem value="Employment">Employment</SelectItem>
                      <SelectItem value="Licensing">Licensing</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Intellectual Property">Intellectual Property</SelectItem>
                      <SelectItem value="Supply Chain">Supply Chain</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Construction">Construction</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Legal Services">Legal Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    name="description" 
                    placeholder="Brief description" 
                    value={documentData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <TabsContent value="upload" className="mt-0">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center bg-slate-50">
                    {!selectedFile ? (
                      <>
                        <Upload className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-slate-900 mb-1">Upload a document</h3>
                        <p className="text-sm text-slate-500 mb-4">PDF, Word documents, text files, and other document formats are supported</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-3">
                          <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                            Browse Files
                            <Input 
                              id="file-upload" 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,.doc,.docx,.txt,.rtf,.md,.odt,.pages"
                              onChange={handleFileChange}
                            />
                          </label>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={loadSampleContract}
                          >
                            Use Sample Contract
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between bg-white p-4 rounded border border-slate-200">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center mr-3">
                            <File className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{selectedFile.name}</p>
                            <p className="text-xs text-slate-500">
                              {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || 'Unknown type'}
                            </p>
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={removeFile}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          <X size={18} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="mt-0">
                <div className="space-y-4">
                  {/* Template Library Section */}
                  <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200">
                    <div className="flex items-center mb-3">
                      <BookIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-medium text-slate-900">Template Library</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {DOCUMENT_TEMPLATES.slice(0, 6).map((template) => (
                        <Button 
                          key={template.id}
                          variant="outline"
                          size="sm"
                          onClick={() => loadTemplate(template.id)}
                          className="justify-start text-left h-auto py-2 overflow-hidden"
                        >
                          <div className="w-full overflow-hidden">
                            <div className="font-medium text-sm truncate">{template.title}</div>
                            <div className="text-xs text-slate-500 truncate">{template.category}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content">Document Content <span className="text-red-500">*</span></Label>
                    <Textarea 
                      id="content" 
                      name="content" 
                      placeholder="Enter or paste document text here" 
                      value={documentData.content}
                      onChange={handleInputChange}
                      className="font-mono text-sm min-h-[300px]"
                      required
                    />
                  </div>
                </div>
              </TabsContent>
              
              
              {/* Upload and Analysis Buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
                <Button
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                
                {showAnalysisButton ? (
                  // After document upload, show Start Analysis button
                  <Button 
                    type="button"
                    onClick={handleStartAnalysis}
                    disabled={isProcessing}
                    className="relative"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Analysis ({processProgress}%)
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="mr-2 h-4 w-4" />
                        Start Analysis
                      </>
                    )}
                  </Button>
                ) : (
                  // Initial upload button
                  <Button 
                    type="submit"
                    disabled={isProcessing || !documentData.content}
                    className="relative"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading ({processProgress}%)
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Document
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Tabs>
      </CardContent>
    </Card>
  );
};

export default DocumentUploader;