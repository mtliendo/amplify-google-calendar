import React from 'react';
import { Calendar, Settings } from 'lucide-react';

interface NavigationProps {
  currentPage: 'meetings' | 'settings';
  onPageChange: (page: 'meetings' | 'settings') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 mb-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xl font-bold text-gray-900">Calendar App</span>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => onPageChange('meetings')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'meetings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Today's Meetings
              </button>
              
              <button
                onClick={() => onPageChange('settings')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;