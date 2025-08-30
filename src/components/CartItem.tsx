interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  };
}

export default function CartItem({ item }: CartItemProps) {
  return (
    <div className="border rounded-lg p-4 flex justify-between items-center">
      <div>
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-gray-600">Quantity: {item.quantity}</p>
      </div>
      <div className="text-right">
        <p className="font-bold">${item.price}</p>
        <p className="text-sm text-gray-500">Total: ${item.price * item.quantity}</p>
      </div>
    </div>
  );
}
