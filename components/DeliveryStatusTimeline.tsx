import React from 'react';
import { DeliveryStatus } from '../types';
import { CheckCircle, Clock, Truck, Package, XCircle } from 'lucide-react';

interface DeliveryStatusTimelineProps {
  status: DeliveryStatus;
}

const DeliveryStatusTimeline: React.FC<DeliveryStatusTimelineProps> = ({ status }) => {
  const steps = [
    { label: 'Pendente', value: DeliveryStatus.PENDENTE, icon: Clock },
    { label: 'Aceite', value: DeliveryStatus.ACEITE, icon: Package },
    { label: 'Em Rota', value: DeliveryStatus.EM_ROTA, icon: Truck },
    { label: 'Entregue', value: DeliveryStatus.ENTREGUE, icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(s => s.value === status);
  const isCancelled = status === DeliveryStatus.CANCELADO;

  return (
    <div className="py-6">
      {isCancelled ? (
        <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl border border-red-100 text-red-700">
          <XCircle size={20} />
          <span className="font-bold text-sm">Entrega Cancelada</span>
        </div>
      ) : (
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 -z-10">
            <div 
              className="h-full bg-[#2E7D32] transition-all duration-500" 
              style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>

          <div className="flex justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500 ${
                    isActive ? 'bg-[#2E7D32] text-white' : 'bg-gray-200 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}`}>
                    <Icon size={18} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[#1B5E20]' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryStatusTimeline;
