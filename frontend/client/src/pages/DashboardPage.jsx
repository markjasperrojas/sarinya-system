export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="mt-6 space-x-4">
        <a
          href="/inventory"
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Inventory
        </a>
        <a href="/sales" className="px-4 py-2 bg-blue-600 text-white rounded">
          Sales
        </a>
      </div>
    </div>
  );
}
