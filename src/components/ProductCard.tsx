interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
      <img 
        src={product.image} 
        alt={product.name}
        className="w-full h-48 object-cover rounded-md mb-4"
      />
      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
      <p className="text-gray-600 mb-2">${product.price}</p>
      <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
        Add to Cart
      </button>
    </div>
  );
}
