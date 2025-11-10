/**
 * Invoice Detail Page - Shows extraction, matching, fraud detection results
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { invoiceAPI, Invoice } from '../lib/invoice-api';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const navigate = useNavigate();

  const fetchInvoice = useCallback(async () => {
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
    fetchInvoice();
  }, [fetchInvoice]);

  useEffect(() => {
    if (!id) return;
    const currentStatus = (invoice?.status || '').toUpperCase();
    if (currentStatus === 'COMPLETED') {
      return;
    }

    const interval = setInterval(fetchInvoice, 2000);
    return () => clearInterval(interval);
  }, [id, invoice?.status, fetchInvoice]);

  const handleAskQuestion = async () => {
    if (!chatQuestion.trim() || !id) return;

    setChatLoading(true);
    try {
      const response = await invoiceAPI.askQuestion({
        invoice_id: id,
        question: chatQuestion,
      });
      setChatAnswer(response.answer);
    } catch (error: any) {
      setChatAnswer(`Error: ${error.message}`);
    }
    setChatLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-[400px]">
          <CardContent className="pt-6">
            <p className="text-gray-600 text-center mb-4">Invoice not found</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const extracted = invoice.extracted_data;
  const matching = invoice.matching_result;
  const fraud = invoice.fraud_result;
  const normalizedStatus = (invoice.status || '').toUpperCase();
  const PROCESSING_STATES = new Set(['UPLOADED', 'PROCESSING', 'EXTRACTING', 'MATCHING', 'FRAUD_CHECK']);
  const isProcessing = PROCESSING_STATES.has(normalizedStatus);
  const processingLog = invoice.processing_log ?? [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {invoice.invoice_number || `Invoice ${invoice.invoice_id.substring(0, 8)}`}
            </h1>
            <p className="text-gray-600">
              {invoice.vendor_id} • PO: {invoice.po_number || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-4 py-2 rounded font-medium ${
              normalizedStatus === 'COMPLETED'
                ? 'bg-green-100 text-green-800'
                : isProcessing
                ? 'bg-yellow-100 text-yellow-800 animate-pulse'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {normalizedStatus || 'UNKNOWN'}
          </span>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
              <div>
                <p className="font-semibold text-yellow-900">Processing invoice...</p>
                <p className="text-sm text-yellow-700">
                  This typically takes 30-50 seconds. The page will update automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {processingLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {processingLog.slice(-8).reverse().map((event, index) => (
              <div key={`${event.stage}-${index}`} className="flex items-start gap-3">
                <div className="text-xs font-semibold text-gray-500 w-32">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{event.stage.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-600">{event.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Extraction Results */}
      {extracted && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data (45+ Fields)</CardTitle>
            <p className="text-sm text-gray-600">
              Quality Score: {extracted.quality_score}/100 •
              Extraction Time: {extracted.extraction_time_seconds}s •
              Fields: {extracted.field_count}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {/* Vendor Info */}
              <div>
                <h3 className="font-semibold mb-2">Vendor Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Name:</span> {extracted.fields?.vendor_name || 'N/A'}</p>
                  <p><span className="text-gray-600">Address:</span> {extracted.fields?.vendor_address || 'N/A'}</p>
                  <p><span className="text-gray-600">Tax ID:</span> {extracted.fields?.vendor_tax_id || 'N/A'}</p>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="font-semibold mb-2">Bank Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Bank:</span> {extracted.fields?.bank_name || 'N/A'}</p>
                  <p><span className="text-gray-600">Account:</span> {extracted.fields?.bank_account || 'N/A'}</p>
                  <p><span className="text-gray-600">Routing:</span> {extracted.fields?.routing_number || 'N/A'}</p>
                </div>
              </div>

              {/* Invoice Details */}
              <div>
                <h3 className="font-semibold mb-2">Invoice Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Invoice #:</span> {extracted.fields?.invoice_number || 'N/A'}</p>
                  <p><span className="text-gray-600">Date:</span> {extracted.fields?.invoice_date || 'N/A'}</p>
                  <p><span className="text-gray-600">PO #:</span> {extracted.fields?.po_number || 'N/A'}</p>
                  <p><span className="text-gray-600 font-bold">Total:</span> <span className="font-bold">${extracted.fields?.total?.toFixed(2) || '0.00'}</span></p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            {extracted.fields?.line_items && extracted.fields.line_items.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Line Items</h3>
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extracted.fields.line_items.map((item: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{item.description}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">${item.unit_price?.toFixed(2)}</td>
                        <td className="p-2 text-right">${item.line_total?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3-Way Matching Results */}
      {matching && (
        <Card>
          <CardHeader>
            <CardTitle>3-Way Matching Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Invoice ↔ PO */}
              <div className="border p-4 rounded">
                <div className="flex items-center gap-2 mb-2">
                  {matching.invoice_po_status === 'MATCH' ? (
                    <CheckCircle className="text-green-600" />
                  ) : matching.invoice_po_status === 'PARTIAL' ? (
                    <AlertTriangle className="text-yellow-600" />
                  ) : (
                    <XCircle className="text-red-600" />
                  )}
                  <h3 className="font-semibold">Invoice ↔ Purchase Order</h3>
                </div>
                <div className="flex justify-between items-center">
                  <span>Match Score:</span>
                  <span className="text-2xl font-bold">{matching.invoice_po_score}/100</span>
                </div>
                {matching.invoice_po_mismatches?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {matching.invoice_po_mismatches.map((m: string, i: number) => (
                      <p key={i} className="text-sm text-red-600">• {m}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoice ↔ GRN */}
              <div className="border p-4 rounded">
                <div className="flex items-center gap-2 mb-2">
                  {matching.invoice_grn_status === 'MATCH' ? (
                    <CheckCircle className="text-green-600" />
                  ) : matching.invoice_grn_status === 'PARTIAL' ? (
                    <AlertTriangle className="text-yellow-600" />
                  ) : (
                    <XCircle className="text-red-600" />
                  )}
                  <h3 className="font-semibold">Invoice ↔ Goods Receipt Note</h3>
                </div>
                <div className="flex justify-between items-center">
                  <span>Match Score:</span>
                  <span className="text-2xl font-bold">{matching.invoice_grn_score}/100</span>
                </div>
                {matching.invoice_grn_mismatches?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {matching.invoice_grn_mismatches.map((m: string, i: number) => (
                      <p key={i} className="text-sm text-red-600">• {m}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Overall */}
              <div
                className={`p-4 rounded ${
                  matching.overall_status === 'MATCH'
                    ? 'bg-green-50'
                    : matching.overall_status === 'PARTIAL'
                    ? 'bg-yellow-50'
                    : 'bg-red-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Overall Status:</span>
                  <span className="text-xl font-bold">{matching.overall_status}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>Overall Score:</span>
                  <span className="text-2xl font-bold">{matching.overall_score}/100</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fraud Detection */}
      {fraud && (
        <Card>
          <CardHeader>
            <CardTitle>Fraud Detection Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div
                className={`text-6xl font-bold ${
                  fraud.risk_score < 30
                    ? 'text-green-600'
                    : fraud.risk_score < 70
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {fraud.risk_score}/100
              </div>
              <p className="text-xl font-semibold mt-2">Risk Level: {fraud.risk_level}</p>
            </div>

            {fraud.signals && fraud.signals.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Fraud Signals Detected:</h3>
                {fraud.signals.map((signal: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3 border-l-4 ${
                      signal.severity === 'HIGH'
                        ? 'border-red-500 bg-red-50'
                        : signal.severity === 'MEDIUM'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{signal.type}</p>
                        <p className="text-sm mt-1">{signal.description}</p>
                      </div>
                      <span className="font-bold text-lg">+{signal.risk_points}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Chat Q&A */}
      {invoice.status === 'COMPLETE' && (
        <Card>
          <CardHeader>
            <CardTitle>Ask Questions About This Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder="e.g., Why was this invoice flagged?"
                className="flex-1 px-4 py-2 border rounded"
              />
              <Button onClick={handleAskQuestion} disabled={chatLoading}>
                {chatLoading ? 'Thinking...' : 'Ask'}
              </Button>
            </div>

            {chatAnswer && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="whitespace-pre-wrap">{chatAnswer}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendation */}
      {invoice.recommendation && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Recommendation</h3>
                <p className="text-gray-600">Based on 3-way matching and fraud analysis</p>
              </div>
              <span
                className={`px-6 py-3 rounded-lg text-lg font-bold ${
                  invoice.recommendation === 'APPROVE'
                    ? 'bg-green-100 text-green-800'
                    : invoice.recommendation === 'REJECT'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {invoice.recommendation}
              </span>
            </div>

            {invoice.recommendation === 'APPROVE' && (
              <div className="mt-4 flex gap-3">
                <Button size="lg" className="flex-1">Approve Invoice</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
