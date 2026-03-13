import { ImageOff } from "lucide-react";

export default function Card({ image, name, price }) {
  return (
    <div className="card overflow-hidden card-hover">
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageOff className="w-10 h-10 text-gray-300" />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-2xl font-semibold text-gray-900 truncate ">{name}</h3>
        <p className="text-xl text-primary-600 font-bold mt-1">₱{price?.toLocaleString()}.00</p>
      </div>
    </div>
  );
}
