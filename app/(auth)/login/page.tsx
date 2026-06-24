import { LoginForm } from "@/components/auth/LoginForm";
import { Plane } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-600 mb-4">
          <Plane className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to TripSync</h1>
        <p className="text-sm text-gray-500 mt-2">Plan trips, split expenses, travel together</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <LoginForm />
      </div>
    </div>
  );
}
