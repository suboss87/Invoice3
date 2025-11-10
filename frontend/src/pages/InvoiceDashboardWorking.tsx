/**
 * Invoice³ Dashboard - Real-time Data
 */
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileUp, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { invoiceAPI, Invoice } from '../lib/invoice-api';
import { ProcessingPipeline } from '../components/invoice/ProcessingPipeline';

export function InvoiceDashboard() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch invoices from backend
  const fetchInvoices = useCallback(async () => {
    try {
      const data = await invoiceAPI.listInvoices();
      setInvoices(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInvoices();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchInvoices]);

  const PROCESSING_STATUSES = new Set(['UPLOADED', 'PROCESSING', 'EXTRACTING', 'MATCHING', 'FRAUD_CHECK']);
  const isProcessingStatus = (status?: string) => PROCESSING_STATUSES.has((status || '').toUpperCase());
  // Calculate statistics
  const stats = {
    total: invoices.length,
    approved: invoices.filter(i => i.recommendation === 'APPROVE').length,
    flagged: invoices.filter(i => ['REVIEW', 'NEEDS_REVIEW', 'MANUAL_REVIEW', 'REJECT'].includes(i.recommendation || '')).length,
    processing: invoices.filter(i => !i.recommendation || isProcessingStatus(i.status)).length,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
      } else {
        alert('Please upload PDF, PNG, or JPEG files only');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    
    try {
      await invoiceAPI.uploadInvoice(file);
      alert('✅ Invoice uploaded successfully! AI processing started...');
      setFile(null);
      fetchInvoices(); // Refresh data immediately
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error: Upload failed. ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    document.getElementById('file-upload')?.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleUploadClick}
          className="px-8 py-6 bg-blue-600 hover:bg-blue-700 text-base"
        >
          <FileUp className="h-5 w-5 mr-2" />
          Upload Invoice
        </Button>
        <input
          id="file-upload"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Features - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <span className="text-2xl mr-2">🔍</span> Deep ADE Extraction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Extract 45+ fields using LandingAI's advanced document AI
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <span className="text-2xl mr-2">🎯</span> 3-Way Matching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Automated validation: Invoice ↔ PO ↔ GRN with AI discrepancy detection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <span className="text-2xl mr-2">🛡️</span> Fraud Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              LLM-powered detection of bank changes, duplicates, and anomalies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Selected File - Shows when file is selected */}
      {file && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 p-6 bg-white rounded-lg border-2 border-blue-200">
                <FileUp className="h-8 w-8 text-blue-600" />
                <div className="text-left">
                  <p className="text-base font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-5 text-base"
                >
                  {uploading ? 'Processing...' : 'Upload & Process with AI'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="px-8 py-5 text-base"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show Processing Pipeline for processing invoices */}
      {stats.processing > 0 && invoices.filter(i => isProcessingStatus(i.status)).length > 0 && (
        <div className="space-y-4">
          {invoices
            .filter(i => isProcessingStatus(i.status))
            .slice(0, 2) // Show max 2 processing invoices
            .map(invoice => (
              <ProcessingPipeline 
                key={invoice.invoice_id}
                status={invoice.status}
                onComplete={() => fetchInvoices()}
              />
            ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-600 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-gray-600 mt-1">Ready for payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.flagged}</div>
            <p className="text-xs text-gray-600 mt-1">Requires review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.processing > 0 ? <span className="animate-pulse">AI analysis...</span> : 'AI analysis'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 text-sm">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-gray-600 text-sm">
                Click Upload Invoice button above to process your first invoice
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div 
                  key={invoice.invoice_id} 
                  onClick={() => navigate(`/invoice/${invoice.invoice_id}`)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:shadow-md cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    {invoice.recommendation === 'APPROVE' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {(invoice.recommendation === 'REVIEW' || invoice.recommendation === 'NEEDS_REVIEW' || invoice.recommendation === 'MANUAL_REVIEW') && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                    {invoice.recommendation === 'REJECT' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                    {!invoice.recommendation && <Clock className="h-5 w-5 text-blue-600 animate-spin" />}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number || invoice.invoice_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {invoice.extracted_data?.fields?.['VENDOR INFORMATION']?.vendor_name || 'Processing...'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${invoice.extracted_data?.fields?.AMOUNTS?.total || '--'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(invoice.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
