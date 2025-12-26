
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  trend?: string;
  trendColor?: string;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendColor = 'text-green-500', description }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-start justify-between">
      <div>
        <h4 className="text-sm font-medium text-gray-500 uppercase">{title}</h4>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        {trend && <p className={`text-sm mt-2 ${trendColor}`}>{trend}</p>}
      </div>
      <div className="bg-blue-100 text-primary p-3 rounded-full">
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
    </div>
  );
};

export default StatCard;