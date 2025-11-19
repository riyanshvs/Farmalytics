import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Hi = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Michael");

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    }
    
    // Auto-navigate after 2 seconds
    const timer = setTimeout(() => {
      navigate("/location");
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-bold">
          <span className="text-primary">Hi, </span>
          <span className="text-primary">{userName}</span>
        </h1>
      </div>
    </div>
  );
};

export default Hi;
