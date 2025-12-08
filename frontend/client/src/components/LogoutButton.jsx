import { useNavigate } from "react-router-dom";
import { setAuthToken } from "../api";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      // remove token
      localStorage.removeItem("sarinya_token");
      // remove axios header
      setAuthToken(null);
      // go to login
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-5 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
      title="Logout"
    >
      Logout
    </button>
  );
}
