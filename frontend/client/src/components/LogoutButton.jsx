import { useNavigate } from "react-router-dom";
import { setAuthToken } from "../api";
import { LogOut } from "lucide-react";
import Button from "./Button";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      localStorage.removeItem("sarinya_token");
      setAuthToken(null);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/");
    }
  };

  return (
    <Button
      variant="danger"
      size="small"
      icon={LogOut}
      onClick={handleLogout}
      title="Logout"
    >
      <span className="hidden sm:inline">Logout</span>
    </Button>
  );
}
