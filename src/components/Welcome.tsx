import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, LogIn, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroVault from "@/assets/hero-vault.png";

interface WelcomeProps {
  onGetStarted: () => void;
  showAuth?: boolean;
}

export const Welcome = ({ onGetStarted, showAuth = false }: WelcomeProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 medical-gradient rounded-3xl opacity-20 animate-float blur-xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 legal-gradient rounded-3xl opacity-20 animate-float blur-xl" style={{ animationDelay: '2s' }} />
        <div className="absolute top-40 right-20 w-24 h-24 financial-gradient rounded-3xl opacity-20 animate-float blur-xl" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
        {/* Logo/Shield */}
        <div className="flex justify-center mb-6">
          <div className="vault-gradient p-6 rounded-3xl glow-effect animate-pulse-glow">
            <Shield className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Hero Image */}
        <div className="mb-8">
          <img 
            src={heroVault} 
            alt="EverGuard Vault Ecosystem" 
            className="w-full max-w-3xl mx-auto rounded-3xl card-shadow"
          />
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="font-heading font-bold text-5xl md:text-7xl">
            <span className="text-foreground">Ever</span>
            <span 
              className="vault-gradient bg-clip-text text-transparent inline-block"
              style={{ 
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Guard
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground font-medium">
            Your world. Your data. Your control.
          </p>
        </div>

        {/* Description */}
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          A universal secure platform protecting your health, legal, financial, and personal data. 
          Built on BlockDAG. Built for life.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
          {showAuth ? (
            <>
              <Button 
                size="lg" 
                className="vault-gradient text-white px-8 py-6 text-lg hover:opacity-90 transition-smooth group"
                onClick={() => navigate('/register')}
              >
                <UserPlus className="mr-2 w-5 h-5" />
                Create Account
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-smooth" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-6 text-lg border-2 hover:bg-muted transition-smooth"
                onClick={() => navigate('/login')}
              >
                <LogIn className="mr-2 w-5 h-5" />
                Login
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="lg" 
                className="vault-gradient text-white px-8 py-6 text-lg hover:opacity-90 transition-smooth group"
                onClick={onGetStarted}
              >
                Create Your Vault
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-smooth" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-6 text-lg border-2 hover:bg-muted transition-smooth"
              >
                Learn More
              </Button>
            </>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="pt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>BlockDAG Secured</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>End-to-End Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>ISO Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
