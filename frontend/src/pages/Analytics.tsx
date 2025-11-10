/**
 * Invoice³ Analytics - Real-time Live Dashboard
 */
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileUp, CheckCircle, AlertTriangle, XCircle, Clock, TrendingUp, DollarSign, Activity, Upload, Eye, RefreshCw, Ban } from 'lucide-react';
import { Button } from '../components/ui/button';
import { invoiceAPI, Invoice } from '../lib/invoice-api';

export function Analytics() {
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

  // Auto-refresh every 2 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInvoices();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchInvoices]);

  const PROCESSING_STATUSES = new Set(['UPLOADED', 'PROCESSING', 'EXTRACTING', 'MATCHING', 'FRAUD_CHECK']);
  const isProcessingStatus = (status?: string) => PROCESSING_STATUSES.has((status || '').toUpperCase());
  // Calculate statistics
  const stats = {
    total: invoices.length,
    approved: invoices.filter(i => i.recommendation === 'APPROVE').length,
    flagged: invoices.filter(i => i.recommendation === 'REVIEW').length,
    rejected: invoices.filter(i => i.recommendation === 'REJECT').length,
    processing: invoices.filter(i => !i.recommendation || isProcessingStatus(i.status)).length,
    totalValue: invoices.reduce((sum, inv) => {
      const amount = inv.extracted_data?.total_amount || 0;
      return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
    }, 0),
    avgProcessingTime: invoices.length > 0 
      ? invoices.reduce((sum, inv) => {
          if (inv.uploaded_at && inv.processed_at) {
            const uploaded = new Date(inv.uploaded_at).getTime();
            const processed = new Date(inv.processed_at).getTime();
            return sum + (processed - uploaded);
          }
          return sum;
        }, 0) / invoices.filter(i => i.processed_at).length / 1000
      : 0,
  };

  // Pipeline stages
  const pipeline = {
    uploaded: invoices.filter(i => (i.status || '').toUpperCase() === 'UPLOADED').length,
    extracting: invoices.filter(i => (i.status || '').toUpperCase() === 'EXTRACTING').length,
    matching: invoices.filter(i => (i.status || '').toUpperCase() === 'MATCHING').length,
    fraudCheck: invoices.filter(i => (i.status || '').toUpperCase() === 'FRAUD_CHECK').length,
    completed: invoices.filter(i => (i.status || '').toUpperCase() === 'COMPLETED' || Boolean(i.recommendation)).length,
  };

  // Fraud detection stats
  const fraudStats = {
    duplicates: invoices.filter(i => i.fraud_result?.is_duplicate).length,
    bankChanges: invoices.filter(i => i.fraud_result?.bank_account_changed).length,
    amountAnomalies: invoices.filter(i => i.fraud_result?.amount_anomaly).length,
    vendorMismatches: invoices.filter(i => i.matching_result?.vendor_mismatch).length,
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      
      if (!validTypes.includes(selectedFile.type)) {
        alert('Please upload PDF, PNG, or JPEG files only');
        return;
      }

      // Auto-upload immediately
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      try {
        const response = await fetch('http://localhost:8000/api/invoices/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Invoice uploaded:', result);
          fetchInvoices(); // Refresh immediately
        } else {
          alert('Upload failed. Please try again.');
        }
      } catch (error) {
        alert('Error: Backend not responding. Make sure server is running on port 8000.');
      } finally {
        setUploading(false);
        // Reset file input
        e.target.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    document.getElementById('file-upload-analytics')?.click();
  };

  const getStatusBadge = (invoice: Invoice) => {
    if (invoice.recommendation === 'APPROVE') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Approved</span>;
    } else if (invoice.recommendation === 'REVIEW') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">Review</span>;
    } else if (invoice.recommendation === 'REJECT') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Rejected</span>;
    } else {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full animate-pulse">Processing</span>;
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    window.location.href = `/invoice/${invoiceId}`;
  };

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <FileUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats.total > 0 ? `${stats.total} invoices` : 'No data yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Rate</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? Math.round(stats.total / 1) : '--'}
            </div>
            <p className="text-xs text-gray-600 mt-1">invoices/hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">Processed amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgProcessingTime > 0 ? `${stats.avgProcessingTime.toFixed(1)}s` : '--'}
            </div>
            <p className="text-xs text-gray-600 mt-1">seconds per invoice</p>
          </CardContent>
        </Card>
      </div>

      {/* Processing History Table with Upload */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Processing History
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-normal">
                  Live • Updates every 2s
                </span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Recent invoice processing activity</p>
            </div>
            <Button
              onClick={handleUploadClick}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <input
              id="file-upload-analytics"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-900">Invoice #</th>
                    <th className="text-left p-3 font-medium text-gray-900">Vendor</th>
                    <th className="text-left p-3 font-medium text-gray-900">Amount</th>
                    <th className="text-left p-3 font-medium text-gray-900">Type</th>
                    <th className="text-left p-3 font-medium text-gray-900">Status</th>
                    <th className="text-left p-3 font-medium text-gray-900">Uploaded</th>
                    <th className="text-right p-3 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.invoice_id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <p className="font-medium text-gray-900">
                          {invoice.invoice_number || invoice.invoice_id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="p-3 text-gray-700">
                        {invoice.extracted_data?.vendor_name || <span className="text-gray-400 italic">Processing...</span>}
                      </td>
                      <td className="p-3 font-medium text-gray-900">
                        ${invoice.extracted_data?.total_amount?.toLocaleString() || '--'}
                      </td>
                      <td className="p-3 text-gray-600">
                        {invoice.extracted_data?.document_type || 'Invoice'}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(invoice)}
                      </td>
                      <td className="p-3 text-gray-600 text-xs">
                        {new Date(invoice.uploaded_at).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInvoice(invoice.invoice_id)}
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invoice.recommendation && invoice.recommendation !== 'REJECT' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Reject"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.recommendation === 'APPROVE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                              title="Put in Review"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No processing history yet</h3>
              <p className="text-gray-600 text-sm">
                Upload and process invoices to see real-time analytics and insights
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Processing Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Live Processing Pipeline
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-normal flex items-center gap-1">
              <span className="h-2 w-2 bg-green-600 rounded-full animate-pulse"></span>
              Live Streaming
            </span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">Real-time view of invoices flowing through AI processing stages</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Stage 1: Uploaded */}
            <div className="text-center">
              <div className={`border-2 rounded-lg p-4 mb-2 transition-all duration-300 ${
                pipeline.uploaded > 0 ? 'bg-blue-100 border-blue-300 shadow-lg' : 'bg-blue-50 border-blue-200'
              }`}>
                <FileUp className={`h-8 w-8 text-blue-600 mx-auto mb-2 ${pipeline.uploaded > 0 ? 'animate-bounce' : ''}`} />
                <div className="text-2xl font-bold text-blue-600">{pipeline.uploaded}</div>
              </div>
              <p className="text-xs font-medium text-gray-700">Uploaded</p>
              <p className="text-xs text-gray-500">Received</p>
            </div>

            {/* Stage 2: Extracting */}
            <div className="text-center">
              <div className={`border-2 rounded-lg p-4 mb-2 transition-all duration-300 ${
                pipeline.extracting > 0 ? 'bg-purple-100 border-purple-300 shadow-lg' : 'bg-purple-50 border-purple-200'
              }`}>
                <Activity className={`h-8 w-8 text-purple-600 mx-auto mb-2 ${pipeline.extracting > 0 ? 'animate-spin' : ''}`} />
                <div className="text-2xl font-bold text-purple-600">{pipeline.extracting}</div>
              </div>
              <p className="text-xs font-medium text-gray-700">Extracting</p>
              <p className="text-xs text-gray-500">ADE Processing</p>
            </div>

            {/* Stage 3: Matching */}
            <div className="text-center">
              <div className={`border-2 rounded-lg p-4 mb-2 transition-all duration-300 ${
                pipeline.matching > 0 ? 'bg-indigo-100 border-indigo-300 shadow-lg' : 'bg-indigo-50 border-indigo-200'
              }`}>
                <Activity className={`h-8 w-8 text-indigo-600 mx-auto mb-2 ${pipeline.matching > 0 ? 'animate-pulse' : ''}`} />
                <div className="text-2xl font-bold text-indigo-600">{pipeline.matching}</div>
              </div>
              <p className="text-xs font-medium text-gray-700">Matching</p>
              <p className="text-xs text-gray-500">PO ↔ GRN</p>
            </div>

            {/* Stage 4: Fraud Check */}
            <div className="text-center">
              <div className={`border-2 rounded-lg p-4 mb-2 transition-all duration-300 ${
                pipeline.fraudCheck > 0 ? 'bg-yellow-100 border-yellow-300 shadow-lg' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <AlertTriangle className={`h-8 w-8 text-yellow-600 mx-auto mb-2 ${pipeline.fraudCheck > 0 ? 'animate-bounce' : ''}`} />
                <div className="text-2xl font-bold text-yellow-600">{pipeline.fraudCheck}</div>
              </div>
              <p className="text-xs font-medium text-gray-700">Fraud Check</p>
              <p className="text-xs text-gray-500">AI Analysis</p>
            </div>

            {/* Stage 5: Completed */}
            <div className="text-center">
              <div className={`border-2 rounded-lg p-4 mb-2 transition-all duration-300 ${
                pipeline.completed > 0 ? 'bg-green-100 border-green-300 shadow-lg' : 'bg-green-50 border-green-200'
              }`}>
                <CheckCircle className={`h-8 w-8 text-green-600 mx-auto mb-2 ${pipeline.completed > 0 ? 'animate-pulse' : ''}`} />
                <div className="text-2xl font-bold text-green-600">{pipeline.completed}</div>
              </div>
              <p className="text-xs font-medium text-gray-700">Completed</p>
              <p className="text-xs text-gray-500">Ready</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Outcome and Fraud Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Processing Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Outcomes</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Distribution of invoice decisions</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Approved */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Approved</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    {stats.approved} ({stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Review */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Needs Review</span>
                  </div>
                  <span className="text-sm font-semibold text-yellow-600">
                    {stats.flagged} ({stats.total > 0 ? Math.round((stats.flagged / stats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.total > 0 ? (stats.flagged / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Rejected */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Rejected</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    {stats.rejected} ({stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Processing */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Processing</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    {stats.processing} ({stats.total > 0 ? Math.round((stats.processing / stats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full animate-pulse transition-all duration-500" 
                    style={{ width: `${stats.total > 0 ? (stats.processing / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fraud Detection Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Fraud Detection Insights</CardTitle>
            <p className="text-sm text-gray-600 mt-1">AI-powered anomaly detection</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Duplicate Invoices</p>
                  <p className="text-xs text-gray-600">Same invoice detected</p>
                </div>
                <span className="text-xl font-bold text-red-600">{fraudStats.duplicates}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Bank Changes</p>
                  <p className="text-xs text-gray-600">Vendor account modified</p>
                </div>
                <span className="text-xl font-bold text-orange-600">{fraudStats.bankChanges}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Amount Anomalies</p>
                  <p className="text-xs text-gray-600">Unusual pricing detected</p>
                </div>
                <span className="text-xl font-bold text-yellow-600">{fraudStats.amountAnomalies}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">Vendor Mismatches</p>
                  <p className="text-xs text-gray-600">PO vendor discrepancy</p>
                </div>
                <span className="text-xl font-bold text-purple-600">{fraudStats.vendorMismatches}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3-Way Matching Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice ↔ PO Match Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.total > 0 
                ? `${Math.round((invoices.filter(i => i.matching_result?.invoice_po_match).length / stats.total) * 100)}%`
                : '--'
              }
            </div>
            <p className="text-xs text-gray-600 mt-1">Perfect matches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">PO ↔ GRN Match Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.total > 0 
                ? `${Math.round((invoices.filter(i => i.matching_result?.po_grn_match).length / stats.total) * 100)}%`
                : '--'
              }
            </div>
            <p className="text-xs text-gray-600 mt-1">Perfect matches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Full 3-Way Match Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.total > 0 
                ? `${Math.round((invoices.filter(i => i.matching_result?.full_match).length / stats.total) * 100)}%`
                : '--'
              }
            </div>
            <p className="text-xs text-gray-600 mt-1">Complete alignment</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
