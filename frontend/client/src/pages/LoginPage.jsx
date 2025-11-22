export default function LoginPage() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="p-6 bg-white shadow-md rounded-lg w-80">
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

        <input
          type="text"
          placeholder="Username"
          className="w-full border p-2 rounded mb-3"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded mb-4"
        />

        <button className="w-full bg-blue-600 text-white p-2 rounded">
          Login
        </button>
      </div>
    </div>
  );
}
