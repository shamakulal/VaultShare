import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

import {
  loginSchema,
  registerSchema,
  type LoginFormData,
  type RegisterFormData,
} from "../../schemas/auth.schema";

import { registerUser, loginUser } from "../../services/auth.service";



interface AuthPageProps {
  initialMode?: "login" | "register";
}

function AuthPage({ initialMode = "login" }: AuthPageProps) {
  // ==========================================
  // STATE
  // ==========================================
const { checkAuth } = useAuth();

  const [isRegister, setIsRegister] = useState(initialMode === "register");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  const [loginServerError, setLoginServerError] = useState("");
  const [registerServerError, setRegisterServerError] = useState("");

  const navigate = useNavigate();

  // ==========================================
  // LOGIN FORM
  // ==========================================

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // ==========================================
  // REGISTER FORM
  // ==========================================

  const {
    register: registerSignup,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // ==========================================
  // LOGIN SUBMIT
  // ==========================================

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setIsLoginLoading(true);
      setLoginServerError("");

      const response = await loginUser(data);

      console.log("LOGIN SUCCESS:", response);
      await checkAuth();
      navigate("/dashboard");
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      if (axios.isAxiosError(error)) {
        setLoginServerError(
          error.response?.data?.message ||
            "Unable to sign in. Please try again.",
        );
      } else {
        setLoginServerError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  // ==========================================
  // REGISTER SUBMIT
  // ==========================================

  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      setIsRegisterLoading(true);
      setRegisterServerError("");

      const response = await registerUser(data);

      console.log("REGISTER SUCCESS:", response);
await checkAuth();
      navigate("/dashboard");
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      if (axios.isAxiosError(error)) {
        setRegisterServerError(
          error.response?.data?.message ||
            "Unable to create account. Please try again.",
        );
      } else {
        setRegisterServerError("Something went wrong. Please try again.");
      }
    } finally {
      setIsRegisterLoading(false);
    }
  };

  // ==========================================
  // SWITCH TO REGISTER
  // ==========================================

  const switchToRegister = () => {
    setLoginServerError("");
    setIsRegister(true);
    navigate("/register");
  };

  // ==========================================
  // SWITCH TO LOGIN
  // ==========================================

  const switchToLogin = () => {
    setRegisterServerError("");
    setIsRegister(false);
    navigate("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-beige p-4 sm:p-6">
      <div
        className={`auth-container relative min-h-[620px] w-full max-w-[950px] overflow-hidden rounded-[30px] bg-cream shadow-2xl ${
          isRegister ? "active" : ""
        }`}
      >
        {/* ==========================================
            REGISTER FORM
        ========================================== */}

        <section className="form-container sign-up">
          <form
            className="flex h-full flex-col items-center justify-center px-8 sm:px-12"
            onSubmit={handleRegisterSubmit(onRegisterSubmit)}
            noValidate
          >
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brown-primary text-xl font-bold text-cream">
                V
              </div>

              <h1 className="text-3xl font-bold text-brown-dark">
                Create your vault
              </h1>

              <p className="mt-2 text-sm text-brown-warm">
                Create an account and start securing your files.
              </p>
            </div>

            <div className="w-full space-y-4">
              {/* NAME */}

              <div>
                <label
                  htmlFor="register-name"
                  className="mb-2 block text-sm font-semibold text-brown-dark"
                >
                  Full name
                </label>

                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your name"
                  {...registerSignup("name")}
                  className={`w-full rounded-xl border bg-beige px-4 py-3 text-sm text-brown-dark outline-none transition ${
                    registerErrors.name
                      ? "border-red-500"
                      : "border-beige-light focus:border-brown-primary focus:ring-2 focus:ring-brown-primary/20"
                  }`}
                />

                {registerErrors.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {registerErrors.name.message}
                  </p>
                )}
              </div>

              {/* REGISTER EMAIL */}

              <div>
                <label
                  htmlFor="register-email"
                  className="mb-2 block text-sm font-semibold text-brown-dark"
                >
                  Email address
                </label>

                <input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  {...registerSignup("email")}
                  className={`w-full rounded-xl border bg-beige px-4 py-3 text-sm text-brown-dark outline-none transition ${
                    registerErrors.email
                      ? "border-red-500"
                      : "border-beige-light focus:border-brown-primary focus:ring-2 focus:ring-brown-primary/20"
                  }`}
                />

                {registerErrors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {registerErrors.email.message}
                  </p>
                )}
              </div>

              {/* REGISTER PASSWORD */}

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-2 block text-sm font-semibold text-brown-dark"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="register-password"
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    {...registerSignup("password")}
                    className={`w-full rounded-xl border bg-beige px-4 py-3 pr-16 text-sm text-brown-dark outline-none transition ${
                      registerErrors.password
                        ? "border-red-500"
                        : "border-beige-light focus:border-brown-primary focus:ring-2 focus:ring-brown-primary/20"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowRegisterPassword((previous) => !previous)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brown-primary"
                  >
                    {showRegisterPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>

                {registerErrors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {registerErrors.password.message}
                  </p>
                )}
              </div>

              {/* REGISTER SERVER ERROR */}

              {registerServerError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {registerServerError}
                </div>
              )}

              {/* REGISTER BUTTON */}

              <button
                type="submit"
                disabled={isRegisterLoading}
                className="w-full rounded-xl bg-brown-primary px-4 py-3.5 text-sm font-semibold text-cream transition hover:bg-brown-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRegisterLoading ? "Creating Account..." : "Create Account"}
              </button>
            </div>

            {/* MOBILE SWITCH */}

            <p className="mt-6 text-center text-sm text-brown-warm lg:hidden">
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchToLogin}
                className="font-semibold text-brown-primary hover:underline"
              >
                Sign In
              </button>
            </p>
          </form>
        </section>

        {/* ==========================================
            LOGIN FORM
        ========================================== */}

        <section className="form-container sign-in">
          <form
            className="flex h-full flex-col items-center justify-center px-8 sm:px-12"
            onSubmit={handleLoginSubmit(onLoginSubmit)}
            noValidate
          >
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brown-primary text-xl font-bold text-cream">
                V
              </div>

              <h1 className="text-3xl font-bold text-brown-dark">
                Welcome back
              </h1>

              <p className="mt-2 text-sm text-brown-warm">
                Sign in to securely access your vault.
              </p>
            </div>

            <div className="w-full space-y-5">
              {/* LOGIN EMAIL */}

              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-semibold text-brown-dark"
                >
                  Email address
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  {...registerLogin("email")}
                  className={`w-full rounded-xl border bg-beige px-4 py-3 text-sm text-brown-dark outline-none transition ${
                    loginErrors.email
                      ? "border-red-500"
                      : "border-beige-light focus:border-brown-primary focus:ring-2 focus:ring-brown-primary/20"
                  }`}
                />

                {loginErrors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {loginErrors.email.message}
                  </p>
                )}
              </div>

              {/* LOGIN PASSWORD */}

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-semibold text-brown-dark"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...registerLogin("password")}
                    className={`w-full rounded-xl border bg-beige px-4 py-3 pr-16 text-sm text-brown-dark outline-none transition ${
                      loginErrors.password
                        ? "border-red-500"
                        : "border-beige-light focus:border-brown-primary focus:ring-2 focus:ring-brown-primary/20"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowLoginPassword((previous) => !previous)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brown-primary"
                  >
                    {showLoginPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>

                {loginErrors.password && (
                  <p className="mt-1 text-xs text-red-600">
                    {loginErrors.password.message}
                  </p>
                )}
              </div>

              {/* LOGIN SERVER ERROR */}

              {loginServerError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {loginServerError}
                </div>
              )}

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full rounded-xl bg-brown-primary px-4 py-3.5 text-sm font-semibold text-cream transition hover:bg-brown-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoginLoading ? "Signing In..." : "Sign In"}
              </button>
            </div>

            {/* MOBILE SWITCH */}

            <p className="mt-6 text-center text-sm text-brown-warm lg:hidden">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={switchToRegister}
                className="font-semibold text-brown-primary hover:underline"
              >
                Create Account
              </button>
            </p>
          </form>
        </section>

        {/* ==========================================
            DESKTOP SLIDING BROWN PANEL
        ========================================== */}

        <section className="toggle-container hidden lg:block">
          <div className="toggle">
            {/* LEFT PANEL */}

            <div className="toggle-panel toggle-left">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cream text-2xl font-bold text-brown-dark shadow-lg">
                V
              </div>

              <h2 className="text-4xl font-bold">Welcome back!</h2>

              <p className="mt-5 max-w-sm text-center text-base leading-7 text-beige-light">
                Sign in to manage, organize and securely access everything
                stored in your VaultShare account.
              </p>

              <button
                type="button"
                onClick={switchToLogin}
                className="mt-8 rounded-xl border border-cream bg-transparent px-8 py-3 text-sm font-semibold text-cream transition hover:bg-cream hover:text-brown-dark"
              >
                Sign In
              </button>
            </div>

            {/* RIGHT PANEL */}

            <div className="toggle-panel toggle-right">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cream text-2xl font-bold text-brown-dark shadow-lg">
                V
              </div>

              <h2 className="text-4xl font-bold">New here?</h2>

              <p className="mt-5 max-w-sm text-center text-base leading-7 text-beige-light">
                Create your personal vault and take complete control of your
                files and secure sharing.
              </p>

              <button
                type="button"
                onClick={switchToRegister}
                className="mt-8 rounded-xl border border-cream bg-transparent px-8 py-3 text-sm font-semibold text-cream transition hover:bg-cream hover:text-brown-dark"
              >
                Create Account
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuthPage;
