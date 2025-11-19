import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Completion = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Michael");

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    }
    
    // Auto-navigate to dashboard after 3 seconds
    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-4xl">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="text-foreground">Welcome </span>
          <span className="text-primary">{userName}</span>
        </h1>
        <p className="text-3xl md:text-5xl font-bold text-primary">
          Your Personalized Dashboard is Ready
        </p>
      </div>
    </div>
  );
};

export default Completion;
