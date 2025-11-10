import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Gauge, 
  FolderOpen, 
  File, 
  LayoutGrid, 
  Users, 
  Pencil, 
  Book, 
  LineChart,
  Scale,
  Plug,
  UsersRound,
  BarChart3
} from 'lucide-react';
import Logo from './Logo';

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const [user] = useState({
    name: 'Viva',
    title: 'Legal Counsel',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces'
  });

  // Navigation items
  const mainNavItems = [
    { path: '/', label: 'Dashboard', icon: <Gauge className="w-5" /> },
    { path: '/documents', label: 'Documents', icon: <FolderOpen className="w-5" /> },
    { path: '/contracts', label: 'Contract Analysis', icon: <File className="w-5" /> },
    { path: '/knowledge-base', label: 'Knowledge Base', icon: <Book className="w-5" /> },
    { path: '/integrations', label: 'Integrations', icon: <Plug className="w-5" /> },
  ];

  const toolsNavItems = [
    { path: '/document-drafting', label: 'Document Drafting', icon: <Pencil className="w-5" /> },
    { path: '/analytics', label: 'Analytics', icon: <LineChart className="w-5" /> },
  ];

  return (
    <div className="w-64 bg-[#1a365d] text-white flex flex-col h-full">
      <div className="p-4 border-b border-[#2a4a7f] flex items-center">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
          <Scale className="h-5 w-5 text-white" />
        </div>
        <span className="ml-2 text-white font-medium">Invoice³</span>
      </div>
      
      <nav className="p-2 flex-grow">
        <div className="space-y-1">
          <p className="px-4 pt-2 text-xs uppercase tracking-wider text-gray-400 font-medium">Main</p>
          {mainNavItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center space-x-2 py-2 px-4 rounded-md ${
                location === item.path ? 'bg-[#2a4a7f]' : 'hover:bg-[#2a4a7f]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          
          <p className="px-4 pt-4 text-xs uppercase tracking-wider text-gray-400 font-medium">Tools</p>
          {toolsNavItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center space-x-2 py-2 px-4 rounded-md ${
                location === item.path ? 'bg-[#2a4a7f]' : 'hover:bg-[#2a4a7f]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      
      <div className="p-4 border-t border-[#2a4a7f]">
        <div className="flex items-center space-x-2">
          <img 
            src={user.profileImage} 
            alt="Profile" 
            className="h-8 w-8 rounded-full"
          />
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-400">{user.title}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
