import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Shield, ChevronRight, Info } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [digilockerLoading, setDigilockerLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  const handleDigiLocker = () => {
    // DigiLocker uses OAuth — show info since it's not yet wired to a provider
    setDigilockerLoading(true);
    setTimeout(() => {
      setDigilockerLoading(false);
      setError("DigiLocker integration requires backend configuration. Please use Google or Email login for now.");
    }, 1200);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-5 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl gradient-primary shadow-xl mb-2">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-sora">RoadWatch</h1>
          <p className="text-blue-200/60 mt-0.5 text-xs">National Road Infrastructure Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6">
          <h2 className="text-xl font-bold text-foreground font-sora mb-4 text-center">Sign In</h2>

          {/* Social Login Buttons */}
          <div className="space-y-2.5 mb-4">
            {/* Google */}
            <Button
              variant="outline"
              className="w-full h-11 text-sm font-medium border border-border hover:bg-gray-50 transition-all flex items-center justify-center"
              onClick={handleGoogle}
            >
              <GoogleIcon className="w-4 h-4 mr-2.5" />
              Continue with Google
            </Button>

            {/* DigiLocker */}
            <Button
              variant="outline"
              className="w-full h-11 text-sm font-medium border border-border hover:bg-gray-50 transition-all flex items-center justify-center"
              onClick={handleDigiLocker}
              disabled={digilockerLoading}
            >
              {digilockerLoading ? (
                <Loader2 className="w-4 h-4 mr-2.5 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-base mr-2.5">🏛️</span>
              )}
              Continue with DigiLocker
            </Button>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2.5 text-muted-foreground text-[10px]">or sign in with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-destructive/10 text-destructive text-xs border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground/80">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11 rounded-xl text-sm"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground/80">Password</Label>
                <Link to="/forgot-password" className="text-[11px] text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-11 rounded-xl text-sm"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age" className="text-xs font-semibold text-foreground/80">Age</Label>
              <div className="relative">
                <Input
                  id="age"
                  type="number"
                  placeholder="Your Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="h-11 rounded-xl text-sm pl-4"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mobile" className="text-xs font-semibold text-foreground/80">Mobile Number</Label>
              <div className="relative">
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Your Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="h-11 rounded-xl text-sm pl-4"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold rounded-xl gradient-primary border-0 text-white shadow-md text-sm mt-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="flex flex-col gap-2.5 items-center justify-center mt-4 pt-1 border-t border-border/40">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Register
              </Link>
            </p>
            <Link 
              to="/profile" 
              className="text-xs text-muted-foreground/85 hover:text-foreground font-semibold hover:underline transition-colors"
            >
              Skip & Continue as Guest
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-blue-200/40 mt-4">
          Government of India · Ministry of Road Transport & Highways
        </p>
      </motion.div>
    </div>
  );
}