import { ShoppingCart, Shirt } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";

interface NavbarProps {
  cartItemsCount?: number;
}

const Navbar = ({ cartItemsCount = 0 }: NavbarProps) => {
  const location = useLocation();
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Shirt className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            StampShirts
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <Link 
            to="/" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/" ? "text-primary" : "text-foreground"
            }`}
          >
            Início
          </Link>
          <Link 
            to="/personalizar" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/personalizar" ? "text-primary" : "text-foreground"
            }`}
          >
            Personalizar
          </Link>
          <Link 
            to="/envio" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/envio" ? "text-primary" : "text-foreground"
            }`}
          >
            Envio
          </Link>
          <Link 
            to="/admin" 
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === "/admin" ? "text-primary" : "text-foreground"
            }`}
          >
            Admin
          </Link>
          
          <Link to="/carrinho">
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
