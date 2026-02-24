import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import LogoData from "@/assets/image.png";
import LoginBg from "@/assets/login-bg.jpg";
import FlightIcon from "@/assets/icon.png";

const Signup = () => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp({ email, password, full_name: fullName });
      toast.success("Account created successfully!");
    } catch (error: any) {
      toast.error(error.error || "Signup failed");
    }
    setLoading(false);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 bg-cover bg-center"
      style={{ backgroundImage: `url(${LoginBg})` }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      <div className="relative w-full max-w-md p-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="relative h-32 bg-[#dbeafe] p-6">
            <div className="relative z-10">
              <h1 className="text-xl font-bold text-[#556ee6]">Join Aerotrend !</h1>
              <p className="mt-1 text-sm text-[#6b7280]">Register to get started</p>
            </div>

            <div className="absolute right-4 top-4 opacity-80">
              <img src={FlightIcon} alt="Flight Icon" className="h-24 w-24 object-contain opacity-90" />
            </div>
          </div>

          <div className="relative -mt-10 ml-8 mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md p-1">
              <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                <img src={LogoData} alt="Logo" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>

          <div className="px-8 pb-8 pt-2">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Enter full name"
                  className="h-11 border-gray-300 focus:border-blue-500 rounded-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter email"
                  className="h-11 border-gray-300 focus:border-blue-500 rounded-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter Password"
                  className="h-11 border-gray-300 focus:border-blue-500 rounded-md"
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full h-11 bg-[#556ee6] hover:bg-[#4a5fcc] text-white text-base font-medium rounded-md mt-2" disabled={loading}>
                {loading ? "Creating account…" : "Sign Up"}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-[#556ee6] font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
