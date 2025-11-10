import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Download, Search, ZoomIn, ZoomOut } from 'lucide-react';

interface DocumentViewerProps {
  documentContent: string;
  title?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentContent, title }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Split document into pages based on double newlines
  // In a real app, this would use a PDF viewer library like PDF.js
  const pages = documentContent.split('\n\n\n').filter(Boolean);
  const totalPages = pages.length;
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 10, 200));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 10, 50));
  };
  
  const handleDownload = () => {
    // In a real app, this would generate a PDF or download the original
    const element = document.createElement('a');
    const file = new Blob([documentContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title || 'document'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const highlightSearchResults = (text: string) => {
    if (!searchQuery) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <span key={i} className="bg-yellow-200">{part}</span> 
        : part
    );
  };
  
  const currentContent = pages[currentPage - 1] || '';
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{title || 'Document Viewer'}</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-8 h-9 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] text-sm w-40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{zoomLevel}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md p-6 bg-white min-h-[500px] overflow-auto">
          <div 
            className="prose max-w-none" 
            style={{ fontSize: `${zoomLevel}%` }}
          >
            {currentContent.split('\n').map((line: string, i: number) => (
              <React.Fragment key={i}>
                {highlightSearchResults(line)}
                <br />
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentViewer;
