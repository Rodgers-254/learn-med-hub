// src/components/Header.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Stethoscope, User, Menu, LogOut, BookOpen, Video } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, signOut } = useAuth();

  // Navigation items visible to all users
  const navigationItems = [
    { name: "Books", href: "/#books", icon: BookOpen },
    // { name: "Videos", href: "/#videos", icon: Video },
    // { name: "Subscriptions", href: "/#subscriptions", icon: null },
    { name: "About", href: "/#about", icon: null },
  ];

  // Add Library to nav items if user is logged in
  const navItemsWithLibrary = user
    ? [...navigationItems, { name: "Library", href: "/library", icon: BookOpen }]
    : navigationItems;

  // Optional direct Google OAuth (if needed)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("Google sign-in failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      if (signOut) {
        await signOut();
      } else {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Sign-out failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render nav links properly
  function renderNavLink(item: { name: string; href: string; icon: any }) {
    const Icon = item.icon;
    // If href is a hash anchor like "/#books", render <a href="#books">
    if (item.href.startsWith("/#")) {
      return (
        <a
          key={item.name}
          href={item.href.slice(1)} // remove leading '/' so href="#books"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1"
          onClick={() => setIsOpen(false)} // close mobile menu if open
        >
          {Icon && <Icon className="h-4 w-4" />}
          {item.name}
        </a>
      );
    }
    // Otherwise, use react-router Link for normal routes
    return (
      <Link
        key={item.name}
        to={item.href}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1"
        onClick={() => setIsOpen(false)} // close mobile menu if open
      >
        {Icon && <Icon className="h-4 w-4" />}
        {item.name}
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow">
            <Stethoscope className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">MedBooks</span>
            <span className="text-xs text-muted-foreground">Digital Medical Library</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItemsWithLibrary.map(renderNavLink)}
        </nav>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={loading}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <>
              <Link to="/signin">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>

              <Link to="/signup">
                <Button variant="premium" size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[280px]">
            <div className="flex flex-col gap-6 mt-8">
              <nav className="flex flex-col gap-4">
                {navItemsWithLibrary.map((item) => {
                  const Icon = item.icon;
                  // Same logic as desktop for anchors vs links
                  if (item.href.startsWith("/#")) {
                    return (
                      <a
                        key={item.name}
                        href={item.href.slice(1)}
                        className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                        onClick={() => setIsOpen(false)}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        {item.name}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex flex-col gap-3 pt-4 border-t">
                {user ? (
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    disabled={loading}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Link to="/signin" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="justify-start">
                        <User className="h-4 w-4" />
                        Sign In
                      </Button>
                    </Link>

                    <Link to="/signup" onClick={() => setIsOpen(false)}>
                      <Button variant="premium">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
