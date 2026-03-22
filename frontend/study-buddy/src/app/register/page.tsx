"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      localStorage.setItem("user", JSON.stringify(formData));
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred during registration");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute top-[20%] right-[20%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-3xl" />
      </div>

      {/* Register card */}
      <div className="max-w-md w-full m-4 relative">
        <div className="bg-background/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
          {/* Logo section */}
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.svg"
                alt="StudyBuddy Logo"
                width={280}
                height={60}
              />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Join StudyBuddy to start your learning journey
            </p>
          </div>

          {/* Form section */}
          <div className="p-8 pt-0">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div
                  className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg"
                  role="alert"
                >
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="firstname"
                      className="block text-sm font-medium text-foreground"
                    >
                      First Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="firstname"
                        name="firstname"
                        type="text"
                        required
                        className="appearance-none block w-full px-3 py-2 border border-input/50 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all duration-200"
                        placeholder="First Name"
                        value={formData.firstname}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="lastname"
                      className="block text-sm font-medium text-foreground"
                    >
                      Last Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="lastname"
                        name="lastname"
                        type="text"
                        required
                        className="appearance-none block w-full px-3 py-2 border border-input/50 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all duration-200"
                        placeholder="Last Name"
                        value={formData.lastname}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground"
                  >
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-input/50 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all duration-200"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="appearance-none block w-full px-3 py-2 border border-input/50 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all duration-200"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-foreground"
                  >
                    Role
                  </label>
                  <div className="mt-1">
                    <select
                      id="role"
                      name="role"
                      className="appearance-none block w-full px-3 py-2 border border-input/50 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 sm:text-sm transition-all duration-200"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="student">Student</option>
                      <option value="professor">Professor</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="relative w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white overflow-hidden group"
                >
                  {/* Button gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-transform group-hover:scale-[1.02] duration-200" />

                  {/* Button content */}
                  <span className="relative">Create Account</span>
                </button>
              </div>
            </form>

            {/* Sign in link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground hover:text-primary transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
