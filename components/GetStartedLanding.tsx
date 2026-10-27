
import Link from "next/link";

export default function GetStartedLanding() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <h1 className="mb-8 text-5xl font-bold text-black">
        Rezz
      </h1>

      <h2 className="mb-4 text-3xl font-semibold text-black">
        Build a resume that gets noticed
      </h2>

      <p className="mb-8 max-w-md text-gray-500">
        Create, manage, and improve your resume in one place.
      </p>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-black px-8 py-3 font-medium text-white! hover:bg-gray-800"
        >
          Log in
        </Link>

        <Link
          href="/login?mode=signup"
          className="rounded-lg border border-gray-300 bg-white px-8 py-3 font-medium text-black hover:bg-gray-100"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
