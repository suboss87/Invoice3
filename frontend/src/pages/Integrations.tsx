import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Settings,
  Zap
} from 'lucide-react';

const Integrations: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">Connect Invoice³ with your favorite tools and services</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current AI Integration */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">OpenAI GPT-4o</CardTitle>
                <p className="text-sm text-gray-600">AI-powered contract analysis</p>
              </div>
            </div>
            <Badge variant="success" className="ml-auto">Connected</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Currently powering all contract analysis, document generation, and legal research features.
            </p>
          </CardContent>
        </Card>

        {/* Coming Soon Card */}
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-700">More Integrations</CardTitle>
                <p className="text-sm text-gray-500">Additional tools and services</p>
              </div>
            </div>
            <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              We're working on integrations with document signing, cloud storage, and other legal tools.
            </p>
          </CardContent>
        </Card>

        {/* Feedback Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Need an Integration?</CardTitle>
                <p className="text-sm text-gray-600">Let us know what you need</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Have a specific tool or service you'd like to integrate? We'd love to hear your suggestions!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Integrations;