import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  trend: number;
  trendLabel: string;
  icon: React.ReactNode;
  iconBgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  trendLabel,
  icon,
  iconBgColor
}) => {
  const isTrendPositive = trend > 0;
  const trendColor = isTrendPositive ? 'text-green-600' : 'text-red-600';
  const TrendIcon = isTrendPositive ? ArrowUp : ArrowDown;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`rounded-full p-3 ${iconBgColor}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
      <div className="mt-2">
        <span className={`text-sm ${trendColor} flex items-center`}>
          <TrendIcon className="mr-1" size={16} />
          {Math.abs(trend)}% {trendLabel}
        </span>
      </div>
    </div>
  );
};

export default StatCard;
