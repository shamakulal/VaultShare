import { useState } from "react";
import { Link } from "react-router-dom";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-beige px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-cream shadow-xl lg:grid-cols-2">
          
          {/* Left side - Branding */}
          <section className="hidden bg-brown-dark p-12 text-cream lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-10 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold text-xl font-bold text-brown-dark">
                  V
                </div>

                <h1 className="text-2xl font-bold tracking-wide">
                  VaultShare
                </h1>
              </div>

              <h2 className="max-w-md text-4xl font-bold leading-tight">
                Your files.
                <br />
                Your vault.
                <br />
                Your control.
              </h2>

              <p className="mt-6 max-w-md text-base leading-7 text-beige-light">
                Store, manage and share your files securely from one simple
                place.
              </p>
            </div>

            <div className="mt-12 rounded-2xl border border-brown-warm p-5">
              <p className="text-sm leading-6 text-beige-light">
                 Private files stay protected. Public files can be shared
                with anyone using a secure link.
              </p>
            </div>
          </section>

          {/* Right side - Login Form */}
          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">
              
              {/* Mobile logo */}
              <div className="mb-10 flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brown-dark text-lg font-bold text-cream">
                  V
                </div>

                <h1 className="text-xl font-bold text-brown-dark">
                  VaultShare
                </h1>
              </div>

              <div>
                <p className="text-sm font-medium text-brown-warm">
                  Welcome back
                </p>

                <h2 className="mt-2 text-3xl font-bold text-brown-dark sm:text-4xl">
                  Sign in to your vault
                </h2>

                <p className="mt-3 text-sm leading-6 text-brown-warm">
                  Enter your details to securely access your files.
                </p>
              </div>

              <form className="mt-8 space-y-5">
                
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-brown-dark"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-beige-light bg-cream px-4 py-3 text-brown-dark outline-none transition placeholder:text-brown-warm focus:border-brown-primary focus:ring-2 focus:ring-brown-primary/20"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-brown-dark"
                    >
                      Password
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-beige-light bg-cream px-4 py-3 pr-16 text-brown-dark outline-none transition placeholder:text-brown-warm focus:border-brown-primary focus:ring-2 focus:ring-brown-primary/20"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm font-medium text-brown-primary hover:bg-beige"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-brown-primary px-4 py-3.5 text-sm font-semibold text-cream transition hover:bg-brown-dark active:scale-[0.99]"
                >
                  Sign In
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-brown-warm">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-brown-primary hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;