import React, { useState, useEffect } from 'react';
import { Document, DocumentAnalysis, Obligation, KeyTerm, RecommendedAction } from '@/lib/types';
import { 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  MessageCircle, 
  BookOpen,
  Save, 
  BarChart,
  ArrowRightLeft,
  FileText,
  Download,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import DocumentChat from './DocumentChat';
// import DocumentAnalyticsDashboard from './DocumentAnalyticsDashboard';
// import RecommendedActions from './RecommendedActions';
// import ClauseFindings from './ClauseFindings';
import SimpleFeedbackWidget from '../rl/SimpleFeedbackWidget';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

interface DocumentComparisonViewProps {
  document: Document;
  analysis: DocumentAnalysis | null;
  isLoading: boolean;
  onAnalyze: () => void;
}

// Helper function to format the document content with more concise and structured display
const formatAnalyzedContent = (content: string, analysis: DocumentAnalysis | null) => {
  if (!analysis || !analysis.highlights) {
    // For brevity, only return a condensed version of the content (first 200 chars)
    const condensedContent = content.length > 200 
      ? content.substring(0, 200) + '...' 
      : content;
    return <div className="mb-4">
      <p className="text-sm text-gray-700 italic mb-2">Document summary:</p>
      <div className="text-sm border-l-2 border-gray-200 pl-4 py-2 bg-gray-50 rounded">
        {condensedContent.replace(/\n/g, ' ')}
      </div>
    </div>;
  }

  // Display key information as bullet points instead of the full marked-up text
  return <div className="space-y-4">
    {/* Contract Summary */}
    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
      <h5 className="text-[15px] font-semibold text-blue-800 mb-2 flex items-center">
        <Info className="h-4 w-4 mr-1.5 text-blue-700" /> Summary
      </h5>
      <p className="text-sm text-gray-700">
        {analysis.summary || (
          analysis.riskAssessment?.overall === 'high' 
            ? `This ${analysis.documentType || 'contract'} between ${analysis.parties?.[0] || 'Party A'} and ${analysis.parties?.[1] || 'Party B'} contains HIGH RISK elements. Key issues include: problematic IP rights transfer clauses, one-sided termination provisions, and excessive liability limitations that may not be enforceable in all jurisdictions.` 
            : analysis.riskAssessment?.overall === 'medium'
              ? `This ${analysis.documentType || 'contract'} between ${analysis.parties?.[0] || 'Party A'} and ${analysis.parties?.[1] || 'Party B'} contains MODERATE RISK elements. The agreement includes unclear payment terms (Section ${analysis.riskAssessment.items[0]?.section || '4'}), ambiguous responsibility allocation, and potentially problematic termination conditions that should be reviewed.`
              : `This ${analysis.documentType || 'contract'} between ${analysis.parties?.[0] || 'Party A'} and ${analysis.parties?.[1] || 'Party B'} has LOW RISK rating. The agreement provides clear terms with balanced protections for both parties, well-defined scope of work, and standard industry terms for this type of agreement.`
        )}
      </p>
    </div>
    
    {/* Brief document summary */}
    <div className="mb-2">
      <h5 className="text-[14px] font-medium text-gray-700 mb-2">Key Points:</h5>
      <div className="text-sm border-l-2 border-blue-100 pl-4 py-2 bg-blue-50/50 rounded">
        {analysis.content && (
          <p className="text-sm text-gray-700">
            {analysis.content.length > 150 
              ? analysis.content.substring(0, 150) + '...' 
              : analysis.content}
          </p>
        )}
      </div>
    </div>
    
    {/* Display important highlights as bullet points */}
    <div className="mb-2">
      <h5 className="text-[14px] font-medium text-gray-700 mb-2">Critical Highlights:</h5>
      <ul className="space-y-1.5 text-sm list-disc list-inside pl-2">
        {analysis.highlights && analysis.highlights.items && analysis.highlights.items.slice(0, 3).map((highlight, index) => (
          <li key={index} className="flex gap-2">
            <div className={`${getHighlightClass(highlight.type)} px-2 py-0.5 rounded-sm text-xs self-start mt-0.5`}>
              {highlight.type.replace(/_/g, ' ')}
            </div>
            <span>{highlight.text}</span>
          </li>
        ))}
        {analysis.highlights && analysis.highlights.items && analysis.highlights.items.length > 3 && (
          <li className="text-blue-600 text-xs italic">
            {analysis.highlights.items.length - 3} more highlights identified...
          </li>
        )}
      </ul>
    </div>
  </div>;
};

const getHighlightClass = (type: string) => {
  switch (type) {
    case 'missing_information':
    case 'missing_party':
      return 'bg-yellow-100 text-yellow-800';
    case 'legal_risk':
      return 'bg-red-100 text-red-800';
    case 'vague_term':
    case 'note':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100';
  }
};

const RiskAssessmentSummary: React.FC<{ analysis: DocumentAnalysis }> = ({ analysis }) => {
  // Comprehensive null checks for analysis and riskAssessment
  if (!analysis || !analysis.riskAssessment) return null;
  
  // Ensure riskAssessment.items exists with a fallback empty array
  const items = analysis.riskAssessment.items || [];
  
  // Count risk items by type with null safety
  const highCount = items.filter(i => i && i.type === 'high').length;
  const mediumCount = items.filter(i => i && i.type === 'medium').length;
  const lowCount = items.filter(i => i && i.type === 'low').length;
  
  // Get overall risk label with fallback to 'Medium Risk'
  const overallRisk = analysis.riskAssessment.overall || 'medium';
  const overallRiskLabel = overallRisk === 'high' 
    ? 'High Risk' 
    : overallRisk === 'medium'
      ? 'Medium Risk'
      : 'Low Risk';
  
  // Calculate risk score (0-100) with null safety
  const riskScore = overallRisk === 'high'
    ? 75 + Math.min(highCount * 5, 20) // 75-95 range
    : overallRisk === 'medium'
      ? 45 + Math.min((highCount * 5) + (mediumCount * 2), 30) // 45-75 range
      : Math.max(10, 45 - (lowCount * 2)); // 10-45 range
      
  // Get risk color for progress bar with null safety
  const riskColor = overallRisk === 'high'
    ? 'bg-red-500'
    : overallRisk === 'medium'
      ? 'bg-amber-500'
      : 'bg-green-500';
  
  return (
    <div className="mt-2">
      {/* Concise Risk Analysis Graphics */}
      <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-900">Contract Risk Score</span>
          <div className="flex items-center">
            <span className="font-medium text-sm">{riskScore}</span>
            <span className="text-xs text-gray-500">/100</span>
          </div>
        </div>
        
        <div className="relative w-full h-2 bg-gray-200 rounded-full mb-2">
          <div 
            className={`absolute top-0 left-0 h-2 rounded-full ${riskColor}`} 
            style={{ width: `${riskScore}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>Lower Risk</span>
          <span>Moderate Risk</span>
          <span>Higher Risk</span>
        </div>
      </div>
      
      {/* Risk counts summary */}
      <div className="flex space-x-3 mb-3">
        {highCount > 0 && (
          <div className="flex items-center text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
            <span className="text-gray-700">{highCount} High</span>
          </div>
        )}
        {mediumCount > 0 && (
          <div className="flex items-center text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>
            <span className="text-gray-700">{mediumCount} Medium</span>
          </div>
        )}
        {lowCount > 0 && (
          <div className="flex items-center text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
            <span className="text-gray-700">{lowCount} Low</span>
          </div>
        )}
      </div>
      
      {/* Top issues - with comprehensive null checks */}
      {analysis && analysis.riskAssessment && analysis.riskAssessment.items && analysis.riskAssessment.items.length > 0 && (
        <div className="mt-2">
          <h6 className="text-xs font-medium text-gray-500 mb-1.5">AI-identified Risk Factors:</h6>
          <ul className="space-y-1.5">
            {analysis.riskAssessment.items.slice(0, 5).map((item, index) => (
              <li key={index} className="flex items-start text-xs group cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                <span className={`flex-shrink-0 mr-1.5 mt-0.5 ${
                  item && item.type === 'high' ? 'text-red-500' : 
                  item && item.type === 'medium' ? 'text-amber-500' : 'text-blue-500'
                }`}>
                  {item && item.type === 'high' ? <AlertCircle size={12} /> : 
                   item && item.type === 'medium' ? <AlertTriangle size={12} /> : <Info size={12} />}
                </span>
                <div>
                  <span className="text-gray-700 text-xs font-medium">{item && item.description}</span>
                  {item && item.section && (
                    <span className="ml-1 text-[10px] text-gray-500 group-hover:text-gray-700">
                      (Section {item.section})
                    </span>
                  )}
                  {item && item.category && (
                    <div className="mt-0.5 text-[10px] text-gray-500 group-hover:block hidden">
                      Category: {item.category}
                    </div>
                  )}
                </div>
              </li>
            ))}
            {analysis.riskAssessment.items.length > 5 && (
              <li className="text-blue-600 text-xs italic pl-4">
                {analysis.riskAssessment.items.length - 5} more issues identified...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const DocumentComparisonView: React.FC<DocumentComparisonViewProps> = ({
  document,
  analysis,
  isLoading,
  onAnalyze
}) => {
  // State to track document modifications from clause actions
  const [documentModifications, setDocumentModifications] = useState<Record<number, { action: string; modifiedText?: string; originalText: string }>>({});
  
  // Handle clause actions - Apply, Retain, or Request Alternative
  const handleClauseAction = (clauseIndex: number, action: 'apply' | 'retain' | 'alternative', alternativeText?: string) => {
    if (!analysis?.clausesFound?.[clauseIndex]) return;
    
    const clause = analysis.clausesFound[clauseIndex];
    let modifiedText = clause.current_text; // Default to original
    
    if (action === 'apply') {
      modifiedText = clause.suggested_replacement;
    } else if (action === 'alternative' && alternativeText) {
      modifiedText = alternativeText;
    }
    
    setDocumentModifications(prev => ({
      ...prev,
      [clauseIndex]: {
        action,
        modifiedText: action === 'retain' ? clause.current_text : modifiedText,
        originalText: clause.current_text
      }
    }));
    
    // In a real application, this would trigger a backend update
    console.log(`Clause ${clauseIndex} - Action: ${action}`, {
      original: clause.current_text,
      modified: modifiedText,
      section: clause.section
    });
  };
  const [notes, setNotes] = useState<string>(document.notes || '');
  const [exportingPDF, setExportingPDF] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateNotesMutation = useMutation({
    mutationFn: async (updatedNotes: string) => {
      const res = await apiRequest('PATCH', `/api/documents/${document.id}`, { notes: updatedNotes });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Notes saved',
        description: 'Your case notes have been saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}`] });
    },
    onError: (error) => {
      toast({
        title: 'Error saving notes',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Enhanced Professional PDF export function for clause redlining
  const exportClauseRedliningToPDF = async () => {
    toast({
      title: 'Feature not available',
      description: 'PDF export is currently disabled.',
      variant: 'destructive',
    });
    return;
    /* COMMENTED OUT - jsPDF not installed
    if (!analysis?.clausesFound || analysis.clausesFound.length === 0) {
      toast({
        title: 'No redlining data',
        description: 'Please run clause analysis first to generate redlining data.',
        variant: 'destructive',
      });
      return;
    }

    setExportingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let currentY = margin;

      // Professional Cover Page
      pdf.setFontSize(24);
      pdf.setTextColor(26, 54, 93);
      pdf.text('PROFESSIONAL CONTRACT', margin, currentY);
      currentY += 10;
      pdf.text('REDLINING ANALYSIS', margin, currentY);
      currentY += 25;
      
      // Document details box
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, currentY, pageWidth - 2 * margin, 40, 3, 3, 'FD');
      
      pdf.setFontSize(12);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Document Title:', margin + 10, currentY + 12);
      pdf.setTextColor(26, 54, 93);
      pdf.setFontSize(14);
      pdf.text(document.title, margin + 10, currentY + 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Analysis Date: ${new Date().toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, margin + 10, currentY + 30);
      
      currentY += 60;
      
      // Summary metrics in professional layout
      if (analysis.redliningSummary) {
        const metrics = [
          { label: 'Clauses Analyzed', value: analysis.redliningSummary.total_clauses_found },
          { label: 'Critical Issues', value: analysis.redliningSummary.critical_issues },
          { label: 'Est. Time Saved', value: analysis.redliningSummary.estimated_time_saved },
          { label: 'Review Status', value: 'Complete' }
        ];
        
        // Create metrics grid
        const boxWidth = (pageWidth - 2 * margin - 15) / 2;
        const boxHeight = 25;
        
        metrics.forEach((metric, index) => {
          const x = margin + (index % 2) * (boxWidth + 15);
          const y = currentY + Math.floor(index / 2) * (boxHeight + 10);
          
          pdf.setDrawColor(220, 220, 220);
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'FD');
          
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(metric.label.toUpperCase(), x + 8, y + 10);
          
          pdf.setFontSize(18);
          pdf.setTextColor(26, 54, 93);
          pdf.text(metric.value.toString(), x + 8, y + 20);
        });
        
        currentY += 70;
      }
      
      // Legal disclaimer
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      const disclaimer = 'This analysis is for informational purposes only and does not constitute legal advice. Please consult with qualified legal counsel for specific legal guidance.';
      const disclaimerLines = pdf.splitTextToSize(disclaimer, pageWidth - 2 * margin);
      disclaimerLines.forEach((line: string) => {
        pdf.text(line, margin, pageHeight - 30);
      });
      
      // Start new page for detailed analysis
      pdf.addPage();
      currentY = margin;
      
      // Executive Summary Section
      pdf.setFontSize(18);
      pdf.setTextColor(26, 54, 93);
      pdf.text('EXECUTIVE SUMMARY', margin, currentY);
      currentY += 12;
      
      pdf.setDrawColor(26, 54, 93);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
      
      // Summary content
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      const summaryContent = [
        `Our analysis of "${document.title}" has identified ${analysis.redliningSummary?.total_clauses_found || analysis.clausesFound.length} clauses requiring attention.`,
        `Of these, ${analysis.redliningSummary?.critical_issues || 0} present critical risk factors that should be addressed immediately.`,
        `The redlining recommendations provided follow industry best practices and legal precedent.`,
        `Estimated time savings from this analysis: ${analysis.redliningSummary?.estimated_time_saved || 'significant'}.`
      ];
      
      summaryContent.forEach(paragraph => {
        const lines = pdf.splitTextToSize(paragraph, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          if (currentY > pageHeight - 30) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += 6;
        });
        currentY += 4;
      });
      
      currentY += 10;
      
      // Risk Assessment Overview
      pdf.setFontSize(14);
      pdf.setTextColor(26, 54, 93);
      pdf.text('Risk Assessment Overview', margin, currentY);
      currentY += 10;
      
      const riskCounts = {
        critical: analysis.clausesFound.filter((c: any) => c.risk_level === 'critical').length,
        high: analysis.clausesFound.filter((c: any) => c.risk_level === 'high').length,
        moderate: analysis.clausesFound.filter((c: any) => c.risk_level === 'moderate').length,
        low: analysis.clausesFound.filter((c: any) => c.risk_level === 'low').length
      };
      
      Object.entries(riskCounts).forEach(([level, count]) => {
        if (count > 0) {
          const color = level === 'critical' ? [220, 53, 69] : 
                       level === 'high' ? [255, 143, 0] :
                       level === 'moderate' ? [255, 193, 7] : [40, 167, 69];
          
          pdf.setTextColor(color[0], color[1], color[2]);
          pdf.setFontSize(10);
          pdf.text(`● ${level.toUpperCase()} RISK: ${count} clause${count > 1 ? 's' : ''}`, margin + 10, currentY);
          currentY += 6;
        }
      });
      
      currentY += 15;
      
      // Detailed Clause Analysis
      pdf.setFontSize(18);
      pdf.setTextColor(26, 54, 93);
      pdf.text('DETAILED CLAUSE ANALYSIS', margin, currentY);
      currentY += 12;
      
      pdf.setDrawColor(26, 54, 93);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      analysis.clausesFound.forEach((clause: any, index: number) => {
        // Check if we need a new page for this clause
        if (currentY > pageHeight - 80) {
          pdf.addPage();
          currentY = margin;
        }

        // Clause header with professional styling
        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(220, 220, 220);
        pdf.roundedRect(margin, currentY - 5, pageWidth - 2 * margin, 20, 2, 2, 'FD');
        
        pdf.setFontSize(14);
        pdf.setTextColor(26, 54, 93);
        pdf.text(`CLAUSE ${index + 1}: ${(clause.type || 'Contract Provision').toUpperCase().replace(/_/g, ' ')}`, margin + 8, currentY + 8);
        
        // Risk level indicator
        const riskColors = {
          critical: [220, 53, 69],
          high: [255, 143, 0],
          moderate: [255, 193, 7],
          low: [40, 167, 69]
        };
        const riskColor = riskColors[clause.risk_level as keyof typeof riskColors] || [100, 100, 100];
        
        pdf.setFontSize(9);
        pdf.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
        pdf.text(`${clause.risk_level.toUpperCase()} RISK`, pageWidth - margin - 40, currentY + 8);
        
        currentY += 25;

        // Section reference
        if (clause.section) {
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Section: ${clause.section}`, margin, currentY);
          currentY += 8;
        }
        
        // User decision status (if available)
        const userDecision = documentModifications[index];
        if (userDecision) {
          const statusColors = {
            apply: [40, 167, 69],
            retain: [100, 100, 100],
            alternative: [59, 130, 246]
          };
          const statusColor = statusColors[userDecision.action as keyof typeof statusColors] || [100, 100, 100];
          
          pdf.setFontSize(9);
          pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
          pdf.text(`REVIEWER ACTION: ${userDecision.action.toUpperCase()}`, margin, currentY);
          currentY += 10;
        }

        // Original text section
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 60);
        pdf.text('Original Text:', margin, currentY);
        currentY += 8;
        
        // Red background box for original text
        const originalTextLines = pdf.splitTextToSize(clause.current_text, pageWidth - 2 * margin - 20);
        const originalBoxHeight = (originalTextLines.length * 5) + 10;
        
        pdf.setFillColor(254, 242, 242);
        pdf.setDrawColor(248, 113, 113);
        pdf.roundedRect(margin, currentY - 3, pageWidth - 2 * margin, originalBoxHeight, 2, 2, 'FD');
        
        pdf.setTextColor(127, 29, 29);
        pdf.setFontSize(10);
        originalTextLines.forEach((line: string) => {
          pdf.text(line, margin + 10, currentY + 3);
          currentY += 5;
        });
        currentY += 12;

        // Suggested replacement section
        pdf.setFontSize(12);
        pdf.setTextColor(60, 60, 60);
        const suggestionTitle = userDecision?.action === 'alternative' ? 'Final Approved Text:' : 'Suggested Replacement:';
        pdf.text(suggestionTitle, margin, currentY);
        currentY += 8;
        
        // Green background box for suggested text
        const finalText = userDecision?.action === 'alternative' ? userDecision.modifiedText : clause.suggested_replacement;
        const suggestionLines = pdf.splitTextToSize(finalText, pageWidth - 2 * margin - 20);
        const suggestionBoxHeight = (suggestionLines.length * 5) + 10;
        
        const boxColor = userDecision?.action === 'retain' ? [243, 244, 246] : [240, 253, 244];
        const borderColor = userDecision?.action === 'retain' ? [156, 163, 175] : [34, 197, 94];
        const textColor = userDecision?.action === 'retain' ? [75, 85, 99] : [20, 83, 45];
        
        pdf.setFillColor(boxColor[0], boxColor[1], boxColor[2]);
        pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        pdf.roundedRect(margin, currentY - 3, pageWidth - 2 * margin, suggestionBoxHeight, 2, 2, 'FD');
        
        pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
        pdf.setFontSize(10);
        suggestionLines.forEach((line: string) => {
          pdf.text(line, margin + 10, currentY + 3);
          currentY += 5;
        });
        currentY += 12;

        // Legal explanation with enhanced formatting
        pdf.setFillColor(239, 246, 255);
        pdf.setDrawColor(147, 197, 253);
        const explanationLines = pdf.splitTextToSize(clause.explanation, pageWidth - 2 * margin - 20);
        const explanationBoxHeight = (explanationLines.length * 5) + 20;
        
        pdf.roundedRect(margin, currentY - 3, pageWidth - 2 * margin, explanationBoxHeight, 2, 2, 'FD');
        
        pdf.setFontSize(11);
        pdf.setTextColor(30, 64, 175);
        pdf.text('Legal Analysis:', margin + 10, currentY + 8);
        
        pdf.setTextColor(30, 58, 138);
        pdf.setFontSize(10);
        explanationLines.forEach((line: string, idx: number) => {
          pdf.text(line, margin + 10, currentY + 18 + (idx * 5));
        });
        
        currentY += explanationBoxHeight + 10;
        
        // Add spacing between clauses
        currentY += 15;
      });
      
      // Final Contract Summary Page
      pdf.addPage();
      currentY = margin;
      
      pdf.setFontSize(18);
      pdf.setTextColor(26, 54, 93);
      pdf.text('FINALIZED CONTRACT TEXT', margin, currentY);
      currentY += 12;
      
      pdf.setDrawColor(26, 54, 93);
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;
      
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text('This section presents the contract with all approved redlining changes applied:', margin, currentY);
      currentY += 15;
      
      // Generate final contract text with modifications applied
      let finalContractText = document.content;
      
      // Apply user modifications in reverse order to maintain text positions
      Object.entries(documentModifications)
        .sort(([a], [b]) => parseInt(b) - parseInt(a))
        .forEach(([indexStr, modification]) => {
          const index = parseInt(indexStr);
          const clause = analysis.clausesFound?.[index];
          if (clause && modification.action !== 'retain') {
            finalContractText = finalContractText.replace(
              clause.current_text, 
              modification.modifiedText || clause.suggested_replacement
            );
          }
        });
      
      // Add final contract text with proper formatting
      pdf.setFontSize(10);
      pdf.setTextColor(40, 40, 40);
      const finalTextLines = pdf.splitTextToSize(finalContractText, pageWidth - 2 * margin);
      
      finalTextLines.forEach((line: string) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.text(line, margin, currentY);
        currentY += 5;
      });
      
      // Professional footer on all pages
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        
        // Footer content
        pdf.text(
          `Invoice³ Professional Analysis`,
          margin,
          pageHeight - 10
        );
        
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin - 20,
          pageHeight - 10
        );
        
        // Add confidential marking
        if (i > 1) { // Skip cover page
          pdf.setFontSize(7);
          pdf.setTextColor(180, 180, 180);
          pdf.text(
            'CONFIDENTIAL - ATTORNEY WORK PRODUCT',
            pageWidth / 2 - 40,
            pageHeight - 5
          );
        }
      }

      // Save the PDF with professional naming
      const sanitizedTitle = document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const dateStamp = new Date().toISOString().split('T')[0];
      const fileName = `${sanitizedTitle}_contract_redlining_analysis_${dateStamp}.pdf`;
      pdf.save(fileName);

      toast({
        title: 'Professional PDF Report Generated',
        description: `Comprehensive redlining analysis exported as ${fileName}`,
      });

    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error generating the professional PDF report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExportingPDF(false);
    }
    */
  };

  return (
    <div className="p-4">
      
      <div className="flex space-x-2 mb-3">
        <Tabs defaultValue="document" className="w-full">
          <TabsList className="border-b border-gray-200 w-full bg-transparent p-0 mb-4">
            <TabsTrigger 
              value="document" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-medium px-4 py-3 transition-colors hover:text-blue-600 flex items-center"
            >
              <FileText className="h-4 w-4 mr-2 opacity-70" />
              Document View
            </TabsTrigger>
            <TabsTrigger 
              value="redlining" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-medium px-4 py-3 transition-colors hover:text-blue-600 flex items-center"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2 opacity-70" />
              Clause Redlining
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-medium px-4 py-3 transition-colors hover:text-blue-600 flex items-center"
            >
              <BookOpen className="h-4 w-4 mr-2 opacity-70" />
              Notes
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-medium px-4 py-3 transition-colors hover:text-blue-600 flex items-center"
            >
              <MessageCircle className="h-4 w-4 mr-2 opacity-70" />
              Chat
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="document" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-280px)] overflow-y-auto">
              {/* Original Document */}
              <div className="border border-gray-200 rounded-lg shadow-sm bg-white h-full overflow-y-auto">
                <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h4 className="font-semibold text-[#1a365d] flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Original Document
                  </h4>
                  <div className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                    Page 1 of 1
                  </div>
                </div>
                <div className="prose max-w-none text-sm p-5 font-inter leading-relaxed">
                  {document.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className={index === 0 ? 'font-bold text-center text-[15px] mb-6' : 'text-gray-800'}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              
              {/* AI-Annotated Document */}
              <div className="border border-gray-200 rounded-lg shadow-sm bg-white h-full overflow-y-auto">
                <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h4 className="font-semibold text-[#1a365d] flex items-center">
                    <BarChart className="h-4 w-4 mr-2 text-blue-600" />
                    Invoice³ Analysis
                  </h4>
                  <div>
                    {isLoading ? (
                      <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full animate-pulse flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600 mr-1.5 animate-pulse"></div>
                        Analyzing...
                      </span>
                    ) : analysis ? (
                      <span className="text-xs font-medium px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
                        {analysis.completionPercentage}% Complete
                      </span>
                    ) : (
                      <button
                        onClick={onAnalyze}
                        className="text-xs font-medium px-2.5 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm transition-colors"
                      >
                        Start Analysis
                      </button>
                    )}
                  </div>
                </div>
                <div className="prose max-w-none text-sm p-5 font-inter leading-relaxed">
                  {isLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded-md"></div>
                      <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded-md w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded-md"></div>
                    </div>
                  ) : analysis ? (
                    <>
                      {formatAnalyzedContent(analysis.content, analysis)}
                      
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <h5 className="text-[15px] font-semibold text-[#1a365d] mb-4 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                          Risk Analysis Summary
                        </h5>
                        
                        {analysis.riskAssessment && <RiskAssessmentSummary analysis={analysis} />}
                        
                        {/* Simple RL Feedback Widget */}
                        <div className="mt-4">
                          <SimpleFeedbackWidget 
                            documentId={document.id}
                            label="Was this risk analysis helpful?"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="mt-3 text-gray-600 font-medium">Click "Start Analysis" to begin AI-powered document review</p>
                      <p className="mt-2 text-sm text-gray-500">The analysis will identify risks, obligations, and key terms in this contract</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          

          
          <TabsContent value="obligations">
            <div className="p-4 border border-gray-200 rounded-lg bg-white">
              <h3 className="text-lg font-medium text-[#1a365d] mb-4">Contractual Obligations</h3>
              
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-24 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              ) : analysis && analysis.obligations && analysis.obligations.items && analysis.obligations.items.length > 0 ? (
                <div>
                  <ul className="space-y-3">
                    {analysis.obligations.items.map((obligation: Obligation, index: number) => (
                      <li key={index} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <span className="font-medium">{obligation.party}</span>
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                            {obligation.type}
                          </span>
                          {obligation.section && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                              {obligation.section}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-gray-700">{obligation.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-500">No obligations analysis available. Start document analysis first.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="terms">
            <div className="p-4 border border-gray-200 rounded-lg bg-white">
              <h3 className="text-lg font-medium text-[#1a365d] mb-4">Key Terms</h3>
              
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-24 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-24 bg-gray-200 rounded"></div>
                </div>
              ) : analysis && analysis.keyTerms && analysis.keyTerms.items && analysis.keyTerms.items.length > 0 ? (
                <div>
                  <ul className="space-y-3">
                    {analysis.keyTerms.items.map((term: KeyTerm, index: number) => (
                      <li key={index} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <span className="font-medium">{term.term}</span>
                          {term.section && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                              {term.section}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-gray-700">{term.definition}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-gray-500">No key terms analysis available. Start document analysis first.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="notes" className="mt-0">
            <div className="border border-gray-200 rounded-lg shadow-sm bg-white h-[calc(100vh-280px)] overflow-y-auto">
              <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                  <h3 className="font-semibold text-[#1a365d]">Case Notes</h3>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => updateNotesMutation.mutate(notes)}
                  disabled={updateNotesMutation.isPending}
                  className="border-blue-200 hover:border-blue-300 text-blue-600 hover:text-blue-700 hover:bg-blue-50 shadow-sm"
                >
                  {updateNotesMutation.isPending ? 
                    <div className="flex items-center">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                      Saving...
                    </div> : 
                    <div className="flex items-center">
                      <Save className="w-4 h-4 mr-1.5" />
                      Save Notes
                    </div>
                  }
                </Button>
              </div>
              
              <div className="p-5">
                <Textarea
                  placeholder="Enter your legal notes and analysis about this contract here..."
                  className="min-h-[calc(100vh-380px)] border-gray-300 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm font-inter"
                  value={notes || ''}
                  onChange={(e) => setNotes(e.target.value)}
                />
                
                <div className="mt-3 text-xs text-gray-500 flex items-center">
                  <Info className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                  Notes are only visible to you and your team. They are saved automatically when you click "Save Notes".
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="chat" className="mt-0">
            <div className="border border-gray-200 rounded-lg shadow-sm bg-white h-[calc(100vh-280px)] overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 flex items-center bg-gray-50">
                <MessageCircle className="h-4 w-4 mr-2 text-blue-600" />
                <h3 className="font-semibold text-[#1a365d]">Document AI Assistant</h3>
              </div>
              <div className="h-[calc(100vh-332px)]">
                <DocumentChat documentId={document.id} documentTitle={document.title} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="redlining" className="mt-0">
            <div className="border border-gray-200 rounded-lg shadow-sm bg-white h-[calc(100vh-280px)] overflow-y-auto">
              <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="flex items-center">
                  <ArrowRightLeft className="h-4 w-4 mr-2 text-blue-600" />
                  <h3 className="font-semibold text-[#1a365d]">Clause Redlining</h3>
                </div>
                {analysis?.clausesFound && analysis.clausesFound.length > 0 && (
                  <Button
                    onClick={exportClauseRedliningToPDF}
                    disabled={exportingPDF}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    size="sm"
                  >
                    {exportingPDF ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export Professional Report
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="p-5">
                {/* ClauseFindings component not available */}
                <div className="text-center py-12">
                  <p className="text-gray-500">Clause redlining feature is not available for invoice documents.</p>
                </div>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Invoice³ automatically identifies and analyzes all document types during processing to provide comprehensive insights.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DocumentComparisonView;
