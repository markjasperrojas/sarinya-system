export default function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-12 rounded-t-lg mb-1"></div>

      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="h-4 bg-gray-200 rounded flex-1"
              style={{ maxWidth: j === 0 ? "200px" : "100px" }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}
