/**
 * Invoice³ Hackathon Dashboard
 * Clean, focused, demo-ready interface
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Upload, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Clock, Zap } from 'lucide-react';
import { invoiceAPI, Invoice } from '../lib/invoice-api';

export function HackathonDashboard() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadInvoices();
    const interval = setInterval(loadInvoices, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await invoiceAPI.listInvoices();
      setInvoices(data.slice(0, 10)); // Show latest 10
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    if (!file.name.match(/\.(pdf|png|jpg|jpeg)$/i)) {
      alert('Please upload PDF or image files only');
      return;
    }

    setUploading(true);
    try {
      await invoiceAPI.uploadInvoice(file);
      setTimeout(loadInvoices, 1000);
    } catch (err) {
      alert('Upload failed: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const stats = {
    total: invoices.length,
    approved: invoices.filter(i => i.recommendation === 'APPROVE').length,
    flagged: invoices.filter(i => ['REVIEW', 'NEEDS_REVIEW', 'MANUAL_REVIEW', 'REJECT'].includes(i.recommendation || '')).length,
    avgRisk: Math.round(invoices.reduce((sum, i) => sum + (i.risk_score || 0), 0) / invoices.length) || 0
  };

  const getStatusColor = (rec: string | undefined) => {
    if (rec === 'APPROVE') return 'bg-green-50 border-green-200 text-green-700';
    if (rec === 'REJECT') return 'bg-red-50 border-red-200 text-red-700';
    return 'bg-yellow-50 border-yellow-200 text-yellow-700';
  };

  const getStatusIcon = (rec: string | undefined) => {
    if (rec === 'APPROVE') return <CheckCircle2 className="h-4 w-4" />;
    if (rec === 'REJECT') return <XCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Invoice³</h1>
                <p className="text-xs text-gray-500">AI-Powered Invoice Processing</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-700 font-medium">Live Demo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="text-blue-100 text-sm font-medium mb-1">Total Processed</div>
              <div className="text-4xl font-bold text-white mb-2">{stats.total}</div>
              <div className="text-blue-100 text-xs">Invoices analyzed</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="text-green-100 text-sm font-medium mb-1">Approved</div>
              <div className="text-4xl font-bold text-white mb-2">{stats.approved}</div>
              <div className="text-green-100 text-xs">Ready for payment</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="text-yellow-100 text-sm font-medium mb-1">Flagged</div>
              <div className="text-4xl font-bold text-white mb-2">{stats.flagged}</div>
              <div className="text-yellow-100 text-xs">Needs review</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="text-purple-100 text-sm font-medium mb-1">Avg Risk</div>
              <div className="text-4xl font-bold text-white mb-2">{stats.avgRisk}%</div>
              <div className="text-purple-100 text-xs">Fraud detection</div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Zone */}
        <Card 
          className={`border-2 border-dashed transition-all ${
            dragActive ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <CardContent className="p-12">
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                uploading ? 'bg-blue-100 animate-pulse' : 'bg-blue-50'
              }`}>
                <Upload className={`h-8 w-8 text-blue-600 ${uploading ? 'animate-bounce' : ''}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {uploading ? 'Processing...' : 'Drop invoice here or click to upload'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                PDF, PNG, JPG supported • AI extraction in ~25s
              </p>
              <input
                type="file"
                id="file-input"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                disabled={uploading}
              />
              <Button
                onClick={() => document.getElementById('file-input')?.click()}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base shadow-lg"
              >
                {uploading ? 'Processing AI Analysis...' : 'Select Invoice'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoice List */}
        <Card>
          <CardContent className="p-0">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
              <p className="text-sm text-gray-500">Live processing status</p>
            </div>
            
            <div className="divide-y">
              {invoices.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No invoices yet. Upload one to get started!</p>
                </div>
              ) : (
                invoices.map((inv) => (
                  <div
                    key={inv.invoice_id}
                    onClick={() => navigate(`/invoice/${inv.invoice_id}`)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(inv.recommendation)}`}>
                          {getStatusIcon(inv.recommendation)}
                          <span className="text-xs font-semibold">
                            {inv.recommendation === 'APPROVE' ? 'APPROVED' : 
                             inv.recommendation === 'REJECT' ? 'REJECTED' : 'REVIEW'}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {inv.extracted_data?.fields?.['VENDOR INFORMATION']?.vendor_name || 'Processing...'}
                            </span>
                            <span className="text-xs text-gray-400">
                              #{inv.invoice_id.slice(0, 8)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {inv.extracted_data?.fields?.['INVOICE HEADER']?.invoice_number || 'Extracting...'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ${inv.extracted_data?.fields?.AMOUNTS?.total || '--'}
                        </div>
                        {inv.risk_score !== null && (
                          <div className="text-xs text-gray-500 mt-1">
                            Risk: {inv.risk_score}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer Stats */}
        <div className="flex items-center justify-center gap-8 text-sm text-gray-600 py-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span>45+ Fields Extracted</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span>~25s Processing Time</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>99% Accuracy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
