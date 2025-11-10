/**
 * Invoice³ Settings - Comprehensive Configuration
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Mail, MessageSquare, Webhook, Shield, DollarSign, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export function Settings() {
  const [gmailConnected, setGmailConnected] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure Invoice³ integrations and processing rules</p>
      </div>

      {/* Integrations Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Integrations</h2>
        
        {/* Gmail Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <Mail className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Gmail Integration</CardTitle>
                  <p className="text-sm text-gray-600">Receive invoices via email</p>
                </div>
              </div>
              {gmailConnected ? (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">Not Connected</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Dedicated Email Address</Label>
                <Input
                  type="email"
                  placeholder="ap-invoices@yourcompany.com"
                  className="mt-1"
                  defaultValue={gmailConnected ? "ap-invoices@acmecorp.com" : ""}
                />
                <p className="text-xs text-gray-500 mt-1">Forward vendor invoices to this address for auto-processing</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Auto-Processing Rule</Label>
                <Select defaultValue="approved">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Process all emails automatically</SelectItem>
                    <SelectItem value="approved">Only from approved senders</SelectItem>
                    <SelectItem value="manual">Require manual approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Approved Sender Domains</Label>
                <Input
                  placeholder="vendor1.com, vendor2.com, supplier.net"
                  className="mt-1"
                  defaultValue="acme-vendor.com, supplier-corp.com"
                />
              </div>
            </div>
            <Button 
              className={`w-full ${gmailConnected ? "bg-gray-600 hover:bg-gray-700" : "bg-red-600 hover:bg-red-700"}`}
              onClick={() => setGmailConnected(!gmailConnected)}
            >
              {gmailConnected ? "Disconnect Gmail" : "Connect Gmail Account"}
            </Button>
          </CardContent>
        </Card>

        {/* Slack Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Slack Integration</CardTitle>
                  <p className="text-sm text-gray-600">Real-time notifications and approvals</p>
                </div>
              </div>
              {slackConnected ? (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">Not Connected</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Notification Channel</Label>
                <Input
                  placeholder="#ap-invoices"
                  className="mt-1"
                  defaultValue={slackConnected ? "#ap-invoices" : ""}
                />
                <p className="text-xs text-gray-500 mt-1">Channel for invoice notifications and approvals</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Notification Preferences</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">New invoice received</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">Fraud or anomaly detected</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">3-way matching discrepancies</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Daily summary report</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Weekly analytics digest</span>
                  </label>
                </div>
              </div>
            </div>
            <Button 
              className={`w-full ${slackConnected ? "bg-gray-600 hover:bg-gray-700" : "bg-purple-600 hover:bg-purple-700"}`}
              onClick={() => setSlackConnected(!slackConnected)}
            >
              {slackConnected ? "Disconnect Slack" : "Connect Slack Workspace"}
            </Button>
          </CardContent>
        </Card>

        {/* API & Webhooks */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Webhook className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">API & Webhooks</CardTitle>
                <p className="text-sm text-gray-600">Integrate with ERP and accounting systems</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Inbound Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value="https://api.invoice3.com/webhook/inbound"
                    className="mt-1 font-mono text-xs"
                    readOnly
                  />
                  <Button variant="outline" size="sm" className="mt-1">Copy</Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">For vendor portals to send invoices directly</p>
              </div>
              <div>
                <Label className="text-sm font-medium">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value="sk_live_abc123xyz789..."
                    className="mt-1 font-mono text-xs"
                    readOnly
                  />
                  <Button variant="outline" size="sm" className="mt-1">Show</Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Outbound Webhook (ERP)</Label>
                <Input
                  placeholder="https://erp.yourcompany.com/api/invoices"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Send processed invoices to your ERP system</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Configuration Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Invoice Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Approval Workflow */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Approval Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Auto-Approve Threshold</Label>
                <div className="flex gap-2 mt-1">
                  <span className="text-gray-500 self-center">$</span>
                  <Input type="number" placeholder="1000" defaultValue="1000" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Invoices under this amount auto-approved</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Manager Approval Required</Label>
                <div className="flex gap-2 mt-1">
                  <span className="text-gray-500 self-center">$</span>
                  <Input type="number" placeholder="5000" defaultValue="5000" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Director Approval Required</Label>
                <div className="flex gap-2 mt-1">
                  <span className="text-gray-500 self-center">$</span>
                  <Input type="number" placeholder="25000" defaultValue="25000" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">CFO Approval Required</Label>
                <div className="flex gap-2 mt-1">
                  <span className="text-gray-500 self-center">$</span>
                  <Input type="number" placeholder="100000" defaultValue="100000" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matching Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                3-Way Matching Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Price Variance Tolerance</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="number" placeholder="5" defaultValue="5" />
                  <span className="text-gray-500 self-center">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Allow up to 5% price difference</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Quantity Variance Tolerance</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="number" placeholder="2" defaultValue="2" />
                  <span className="text-gray-500 self-center">%</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Date Tolerance</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="number" placeholder="7" defaultValue="7" />
                  <span className="text-gray-500 self-center">days</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Accept invoices within 7 days of GRN date</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Matching Strictness</Label>
                <Select defaultValue="medium">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relaxed">Relaxed - Allow minor discrepancies</SelectItem>
                    <SelectItem value="medium">Medium - Standard validation</SelectItem>
                    <SelectItem value="strict">Strict - Exact match required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Payment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Default Payment Terms</Label>
                <Select defaultValue="net30">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net15">Net 15 days</SelectItem>
                    <SelectItem value="net30">Net 30 days</SelectItem>
                    <SelectItem value="net45">Net 45 days</SelectItem>
                    <SelectItem value="net60">Net 60 days</SelectItem>
                    <SelectItem value="net90">Net 90 days</SelectItem>
                    <SelectItem value="immediate">Immediate payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Early Payment Discount</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="number" placeholder="2" defaultValue="2" />
                  <span className="text-gray-500 self-center">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Discount if paid within 10 days</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Default Currency</Label>
                <Select defaultValue="usd">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD - US Dollar</SelectItem>
                    <SelectItem value="eur">EUR - Euro</SelectItem>
                    <SelectItem value="gbp">GBP - British Pound</SelectItem>
                    <SelectItem value="cad">CAD - Canadian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fraud Detection Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-red-600" />
                Fraud Detection Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Detection Rules</Label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">Flag duplicate invoices</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">Alert on bank account changes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">Detect unusual pricing (&gt;20% deviation)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">Verify vendor registration</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">Check historical vendor patterns</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Monitor invoice frequency</span>
                  </label>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Anomaly Threshold</Label>
                <Select defaultValue="medium">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Flag minimal suspicious activity</SelectItem>
                    <SelectItem value="medium">Medium - Balanced detection</SelectItem>
                    <SelectItem value="high">High - Only critical threats</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Accounting Integration Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Accounting</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>General Ledger Mapping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Default GL Account</Label>
                <Input placeholder="5000-100" className="mt-1" defaultValue="5000-100" />
              </div>
              <div>
                <Label className="text-sm font-medium">Default Cost Center</Label>
                <Input placeholder="OPS-001" className="mt-1" defaultValue="OPS-001" />
              </div>
              <div>
                <Label className="text-sm font-medium">Tax Account</Label>
                <Input placeholder="2100-050" className="mt-1" defaultValue="2100-050" />
              </div>
              <div>
                <Label className="text-sm font-medium">Accounts Payable Account</Label>
                <Input placeholder="2000-100" className="mt-1" defaultValue="2000-100" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Processing Configuration */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">AI Processing</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>AI Model Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Confidence Threshold</Label>
                <Select defaultValue="high">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (70%+) - Process most invoices</SelectItem>
                    <SelectItem value="medium">Medium (85%+) - Balanced accuracy</SelectItem>
                    <SelectItem value="high">High (95%+) - Maximum precision</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Document Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="multi">Multi-language (Auto-detect)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <Label className="text-sm font-medium">Processing Options</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">Enable parallel processing for faster throughput</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">Auto-extract line items and details</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">Validate tax calculations</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">Generate processing summary reports</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Buttons */}
      <div className="flex justify-end gap-3 pt-4 pb-8">
        <Button variant="outline" className="px-8 py-5">
          Reset to Defaults
        </Button>
        <Button className="px-8 py-5 bg-blue-600 hover:bg-blue-700">
          Save All Settings
        </Button>
      </div>
    </div>
  );
}