interface OrderTrackerProps {
  status: string;
}

export function OrderTracker({ status }: OrderTrackerProps) {
  const steps = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  const currentStepIndex = steps.indexOf(status);

  return (
    <div className="mt-2">
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${
              index <= currentStepIndex ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${
                index < currentStepIndex ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-600 mt-1">Status: {status}</p>
    </div>
  );
}
