import Link from "next/link";
export default function LoginPage() {
  return (
    <main>
      <h1>Login</h1>

      <p>Please enter your credentials to log in.</p>

      <form>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
          />
        </div>

        <Link href="/dashboard">
        <button type="button">Login</button>
        </Link>
        
      </form>

      <p>Don&apos;t have an account? Sign up</p>
    </main>
  );
}
