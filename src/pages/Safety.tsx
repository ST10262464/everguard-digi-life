import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Safety = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to GirliesHub project
    window.location.href = 'https://girlieshub.netlify.app/';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h1 className="font-heading font-bold text-3xl">Redirecting to GirliesHub...</h1>
        <p className="text-muted-foreground">Taking you to the GBV support platform.</p>
        <p className="text-sm text-muted-foreground">
          If you are not redirected automatically, <a href="https://girlieshub.netlify.app/" className="text-primary hover:underline">click here</a>.
        </p>
      </div>
    </div>
  );
};

export default Safety;





