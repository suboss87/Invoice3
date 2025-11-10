/**
 * Enhanced Invoice Detail Page
 * Shows complete invoice analysis with all visualizations
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { ProcessingPipeline } from '../components/invoice/ProcessingPipeline';
import { ExtractionQualityCard } from '../components/invoice/ExtractionQualityCard';
import { ThreeWayMatchingCard } from '../components/invoice/ThreeWayMatchingCard';
import { FraudRiskCard } from '../components/invoice/FraudRiskCard';
import { invoiceAPI, Invoice } from '../lib/invoice-api';

export function InvoiceDetailEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllFields, setShowAllFields] = useState(false);
  
  const fetchInvoiceDetail = useCallback(async () => {
    if (!id) return;
    try {
      const data = await invoiceAPI.getInvoice(id);
      setInvoice(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoiceDetail();
  }, [fetchInvoiceDetail]);
  
  useEffect(() => {
    if (!invoice || !id) {
      return;
    }
    const processingStatuses = new Set(['UPLOADED', 'PROCESSING', 'EXTRACTING', 'MATCHING', 'FRAUD_CHECK']);
    const normalizedStatus = (invoice.status || '').toUpperCase();
    if (!processingStatuses.has(normalizedStatus)) {
      return;
    }
    
    const interval = setInterval(fetchInvoiceDetail, 3000);
    return () => clearInterval(interval);
  }, [invoice, id, fetchInvoiceDetail]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Invoice not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  const normalizedStatus = (invoice.status || '').toUpperCase();
  const processingStatuses = new Set(['UPLOADED', 'PROCESSING', 'EXTRACTING', 'MATCHING', 'FRAUD_CHECK']);
  const isProcessing = processingStatuses.has(normalizedStatus);
  const processingLog = invoice.processing_log ?? [];
  
  const getRecommendationConfig = (rec: string) => {
    switch (rec) {
      case 'APPROVE':
        return {
          icon: <CheckCircle className="h-6 w-6" />,
          color: 'text-green-700',
          bg: 'bg-green-100',
          border: 'border-green-300',
          label: 'APPROVE'
        };
      case 'NEEDS_REVIEW':
        return {
          icon: <AlertTriangle className="h-6 w-6" />,
          color: 'text-yellow-700',
          bg: 'bg-yellow-100',
          border: 'border-yellow-300',
          label: 'NEEDS REVIEW'
        };
      case 'REJECT':
        return {
          icon: <XCircle className="h-6 w-6" />,
          color: 'text-red-700',
          bg: 'bg-red-100',
          border: 'border-red-300',
          label: 'REJECT'
        };
      default:
        return null;
    }
  };
  
  const recConfig = invoice.recommendation ? getRecommendationConfig(invoice.recommendation) : null;
  
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="bg-white/[0.06] border-white/[0.15] hover:bg-white/[0.10] text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {invoice.invoice_number || 'Invoice Detail'}
            </h1>
            <p className="text-sm text-white/60">
              ID: {invoice.invoice_id.slice(0, 12)}...
            </p>
          </div>
        </div>
        
        {recConfig && (
          <Badge className={`${recConfig.bg} ${recConfig.color} border-2 ${recConfig.border} px-4 py-2 text-base`}>
            <span className="mr-2">{recConfig.icon}</span>
            {recConfig.label}
          </Badge>
        )}
      </div>
      
      {/* Processing Pipeline */}
      {isProcessing && (
        <ProcessingPipeline 
          status={normalizedStatus}
          onComplete={fetchInvoiceDetail}
        />
      )}

      {processingLog.length > 0 && (
        <Card className="bg-white/[0.06] border-white/[0.15] backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Agentic Processing Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {processingLog.slice(-10).reverse().map((event, idx) => (
              <div key={`${event.stage}-${idx}`} className="flex items-start gap-3">
                <div className="w-28 text-xs font-semibold text-white/50">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <div>
                  <Badge variant="outline" className="mb-1 bg-white/[0.05] border-white/[0.15] text-white/80">
                    {event.stage.replace(/_/g, ' ')}
                  </Badge>
                  <p className="text-sm text-white/70">{event.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Main Content - Two Column Layout */}
      {!isProcessing && invoice.extracted_data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Extraction Quality */}
            {invoice.extracted_data && (
              <ExtractionQualityCard
                qualityScore={invoice.extracted_data.quality_score || 0}
                fieldCount={invoice.extracted_data.field_count || Object.keys(invoice.extracted_data.fields || {}).length}
                confidenceScores={invoice.extracted_data.confidence_scores || {}}
                extractionTime={invoice.extracted_data.extraction_time_seconds}
                extractedFields={invoice.extracted_data.fields || {}}
              />
            )}
            
            {/* Extracted Fields - ALL FIELDS with expand/collapse */}
            <Card className="bg-white/[0.06] border-white/[0.15] backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    Extracted Fields
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-400">
                      {invoice.extracted_data?.fields && Object.entries(invoice.extracted_data.fields)
                        .filter(([_, value]) => value !== null && value !== undefined && value !== '').length} / {invoice.extracted_data?.field_count || 0}
                    </Badge>
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAllFields(!showAllFields)}
                    className="text-white/60 hover:text-white hover:bg-white/[0.05]"
                  >
                    {showAllFields ? (
                      <><ChevronUp className="h-4 w-4 mr-1" /> Collapse</>
                    ) : (
                      <><ChevronDown className="h-4 w-4 mr-1" /> Show All</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {invoice.extracted_data?.fields && Object.entries(invoice.extracted_data.fields)
                    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                    .slice(0, showAllFields ? undefined : 10)
                    .map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between items-start p-3 bg-white/[0.05] border border-white/[0.10] rounded-lg hover:bg-white/[0.08] transition-colors">
                        <span className="text-xs font-medium text-white/60 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-white/90 font-semibold text-right max-w-xs truncate">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
                {!showAllFields && invoice.extracted_data?.fields && Object.entries(invoice.extracted_data.fields).filter(([_, value]) => value !== null && value !== undefined && value !== '').length > 10 && (
                  <div className="mt-3 text-center text-xs text-white/40">
                    Showing 10 of {Object.entries(invoice.extracted_data.fields).filter(([_, value]) => value !== null && value !== undefined && value !== '').length} fields
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            {/* 3-Way Matching */}
            {invoice.matching_result && (
              <ThreeWayMatchingCard matching={invoice.matching_result} />
            )}
            
            {/* Fraud Detection */}
            {invoice.fraud_result && (
              <FraudRiskCard fraud={invoice.fraud_result} />
            )}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      {!isProcessing && invoice.recommendation && (
        <Card className="bg-white/[0.06] border-white/[0.15] backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white mb-1">Next Steps</h3>
                <p className="text-sm text-white/60">
                  {invoice.recommendation === 'APPROVE' && 'This invoice is ready for payment processing.'}
                  {invoice.recommendation === 'NEEDS_REVIEW' && 'This invoice requires manual review before approval.'}
                  {invoice.recommendation === 'REJECT' && 'This invoice has been flagged and should be rejected.'}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="bg-white/[0.06] border-white/[0.15] hover:bg-white/[0.10] text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                {invoice.recommendation === 'APPROVE' && (
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    Approve & Process Payment
                  </Button>
                )}
                {invoice.recommendation === 'NEEDS_REVIEW' && (
                  <Button className="bg-yellow-600 hover:bg-yellow-700">
                    Send for Review
                  </Button>
                )}
                {invoice.recommendation === 'REJECT' && (
                  <Button className="bg-red-600 hover:bg-red-700">
                    Reject Invoice
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
