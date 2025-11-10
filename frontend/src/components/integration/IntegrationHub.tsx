import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarDays, 
  FileText, 
  Mail, 
  PenTool, 
  FileDown, 
  ChevronRight,
  Check,
  Clock,
  BellRing
} from 'lucide-react';

interface IntegrationHubProps {
  documentId?: number;
  documentTitle?: string;
}

// Integration categories and their integrations
const integrationOptions = [
  {
    category: "Document Signing",
    icon: <PenTool className="h-5 w-5" />,
    options: [
      { name: "DocuSign", logo: "docusign", description: "Electronic signature and agreement service" },
      { name: "HelloSign", logo: "hellosign", description: "Secure e-signature solution" },
      { name: "Adobe Sign", logo: "adobe", description: "Adobe's document signing service" }
    ]
  },
  {
    category: "Calendar",
    icon: <CalendarDays className="h-5 w-5" />,
    options: [
      { name: "Google Calendar", logo: "google", description: "Track deadlines and appointments" },
      { name: "Microsoft Outlook", logo: "microsoft", description: "Outlook calendar integration" },
      { name: "Apple Calendar", logo: "apple", description: "Apple calendar integration" }
    ]
  },
  {
    category: "Notifications",
    icon: <BellRing className="h-5 w-5" />,
    options: [
      { name: "Email Notifications", logo: "mail", description: "Get review request updates via email" },
      { name: "SMS Notifications", logo: "message", description: "Receive text updates for urgent matters" },
      { name: "Slack Notifications", logo: "slack", description: "Notifications in your Slack channels" }
    ]
  },
  {
    category: "Export",
    icon: <FileDown className="h-5 w-5" />,
    options: [
      { name: "PDF Export", logo: "pdf", description: "Export documents to PDF format" },
      { name: "DOCX Export", logo: "word", description: "Export to Microsoft Word format" },
      { name: "XLSX Reports", logo: "excel", description: "Export analysis data to Excel" }
    ]
  }
];

// Mock function for connecting integrations
const connectIntegration = (name: string) => {
  // In a real application, this would trigger an OAuth flow or API key setup
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1500);
  });
};

// Individual integration card
const IntegrationCard: React.FC<{
  name: string;
  logo: string;
  description: string;
  onConnect: () => void;
  connected: boolean;
  connecting: boolean;
}> = ({ name, logo, description, onConnect, connected, connecting }) => {
  return (
    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-md bg-slate-100 flex items-center justify-center">
              {logo === "docusign" && <FileText className="h-3.5 w-3.5 text-blue-600" />}
              {logo === "hellosign" && <PenTool className="h-3.5 w-3.5 text-blue-600" />}
              {logo === "adobe" && <FileText className="h-3.5 w-3.5 text-red-600" />}
              {logo === "google" && <CalendarDays className="h-3.5 w-3.5 text-green-600" />}
              {logo === "microsoft" && <CalendarDays className="h-3.5 w-3.5 text-blue-600" />}
              {logo === "apple" && <CalendarDays className="h-3.5 w-3.5 text-gray-600" />}
              {logo === "mail" && <Mail className="h-3.5 w-3.5 text-blue-600" />}
              {logo === "message" && <BellRing className="h-3.5 w-3.5 text-purple-600" />}
              {logo === "slack" && <BellRing className="h-3.5 w-3.5 text-green-600" />}
              {logo === "pdf" && <FileDown className="h-3.5 w-3.5 text-red-600" />}
              {logo === "word" && <FileDown className="h-3.5 w-3.5 text-blue-600" />}
              {logo === "excel" && <FileDown className="h-3.5 w-3.5 text-green-600" />}
            </div>
            <CardTitle className="text-md font-medium">{name}</CardTitle>
          </div>
          {connected && (
            <div className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full font-medium">
              Connected
            </div>
          )}
        </div>
        <CardDescription className="text-xs mt-2">{description}</CardDescription>
      </CardHeader>
      <CardFooter className="pt-1 pb-3">
        <Button 
          variant={connected ? "outline" : "default"} 
          size="sm" 
          className="w-full text-xs h-8" 
          onClick={onConnect}
          disabled={connecting || connected}
        >
          {connecting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Connecting...
            </div>
          ) : connected ? (
            <div className="flex items-center justify-center">
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Configure
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span>Connect</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1.5" />
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Integration Category Section
const IntegrationCategory: React.FC<{
  category: string;
  icon: React.ReactNode;
  options: { name: string; logo: string; description: string }[];
  connectedIntegrations: string[];
  connectingIntegration: string | null;
  onConnectIntegration: (name: string) => void;
}> = ({ 
  category, 
  icon, 
  options, 
  connectedIntegrations, 
  connectingIntegration, 
  onConnectIntegration 
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-3">
        <div className="bg-blue-50 text-blue-600 p-1.5 rounded-md mr-2">
          {icon}
        </div>
        <h3 className="text-sm font-medium text-slate-900">{category}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((integration) => (
          <IntegrationCard
            key={integration.name}
            name={integration.name}
            logo={integration.logo}
            description={integration.description}
            onConnect={() => onConnectIntegration(integration.name)}
            connected={connectedIntegrations.includes(integration.name)}
            connecting={connectingIntegration === integration.name}
          />
        ))}
      </div>
    </div>
  );
};

// Document Review Reminder Component
const ReviewReminder: React.FC<{
  documentTitle?: string;
}> = ({ documentTitle }) => {
  const [email, setEmail] = useState('');
  const [deadline, setDeadline] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock sending notification
    toast({
      title: "Reminder sent",
      description: `A review reminder has been sent for ${documentTitle || 'this document'}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md">Review Request Reminder</CardTitle>
        <CardDescription>Send a reminder for document review with a deadline</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Recipient Email</label>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Review Deadline</label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            Send Review Request
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Document Export Component
const DocumentExport: React.FC<{
  documentTitle?: string;
}> = ({ documentTitle }) => {
  const { toast } = useToast();

  const handleExport = (format: string) => {
    // Mock export functionality
    toast({
      title: `Export as ${format} started`,
      description: `${documentTitle || 'Document'} is being exported.`,
    });
    
    // Simulate download completion
    setTimeout(() => {
      toast({
        title: "Export completed",
        description: `${documentTitle || 'Document'} has been exported as ${format}.`,
      });
    }, 2000);
  };

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-50 text-blue-600 p-1.5 rounded-md">
            <FileDown className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-md font-medium">Export Options</CardTitle>
            <CardDescription className="text-xs">Export documents and analysis data</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="text-xs h-9 justify-start" onClick={() => handleExport('PDF')}>
            <FileDown className="h-3.5 w-3.5 mr-1.5 text-red-600" />
            PDF
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-9 justify-start" onClick={() => handleExport('DOCX')}>
            <FileDown className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
            DOCX
          </Button>
        </div>
        <Separator className="my-1" />
        <p className="text-xs text-slate-500 font-medium mb-1">Analysis Export</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="text-xs h-9 justify-start" onClick={() => handleExport('XLSX')}>
            <FileDown className="h-3.5 w-3.5 mr-1.5 text-green-600" />
            Excel
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-9 justify-start" onClick={() => handleExport('CSV')}>
            <FileDown className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
            CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Calendar Integration Component
const CalendarIntegration: React.FC = () => {
  const [deadline, setDeadline] = useState('');
  const [title, setTitle] = useState('Document Review Deadline');
  const { toast } = useToast();

  const handleAddToCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock adding to calendar
    toast({
      title: "Added to calendar",
      description: `"${title}" has been added to your calendar on ${new Date(deadline).toLocaleDateString()}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md">Add to Calendar</CardTitle>
        <CardDescription>Schedule review deadlines in your calendar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddToCalendar} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Event Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deadline Date</label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            <CalendarDays className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const IntegrationHub: React.FC<IntegrationHubProps> = ({ documentId, documentTitle }) => {
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);
  const [connectingIntegration, setConnectingIntegration] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConnectIntegration = async (name: string) => {
    setConnectingIntegration(name);
    try {
      await connectIntegration(name);
      setConnectedIntegrations([...connectedIntegrations, name]);
      toast({
        title: "Integration connected",
        description: `Successfully connected ${name}`,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: `Failed to connect ${name}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setConnectingIntegration(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Integrations</h2>
          <p className="text-sm text-slate-500 mt-1">Connect your documents to external tools and services</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-sm">
            <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
            Active (3)
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="border-b border-slate-200 w-full bg-transparent p-0 mb-4">
          <TabsTrigger value="active" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-medium">Active Integrations</TabsTrigger>
          <TabsTrigger value="available" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-medium">Available Integrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-0">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-md font-medium">Slack</CardTitle>
                    <div className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full font-medium">Connected</div>
                  </div>
                  <CardDescription className="text-xs">Channel: #legal-documents</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-3 text-xs text-slate-500">
                  Sends notifications when documents need review
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <Button variant="outline" size="sm" className="text-xs">Configure</Button>
                  <Button variant="ghost" size="sm" className="text-xs text-red-600">Disconnect</Button>
                </CardFooter>
              </Card>
              
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-md font-medium">Google Calendar</CardTitle>
                    <div className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full font-medium">Connected</div>
                  </div>
                  <CardDescription className="text-xs">Account: legal@example.com</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-3 text-xs text-slate-500">
                  Tracks deadlines and contract renewal dates
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <Button variant="outline" size="sm" className="text-xs">Configure</Button>
                  <Button variant="ghost" size="sm" className="text-xs text-red-600">Disconnect</Button>
                </CardFooter>
              </Card>
              
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-md font-medium">DocuSign</CardTitle>
                    <div className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full font-medium">Connected</div>
                  </div>
                  <CardDescription className="text-xs">Account: legal@example.com</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-3 text-xs text-slate-500">
                  Electronic signature for contract documents
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <Button variant="outline" size="sm" className="text-xs">Configure</Button>
                  <Button variant="ghost" size="sm" className="text-xs text-red-600">Disconnect</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="available" className="mt-0">
          <div className="space-y-6">
            {integrationOptions.map((category) => (
              <IntegrationCategory
                key={category.category}
                category={category.category}
                icon={category.icon}
                options={category.options}
                connectedIntegrations={connectedIntegrations}
                connectingIntegration={connectingIntegration}
                onConnectIntegration={handleConnectIntegration}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationHub;