import Link from "next/link";

type ResumeCardProps = {
  name: string;
  updatedAt: string;
  resumeId: string;
};

export default function ResumeCard({
  name,
  updatedAt,
  resumeId,
}: ResumeCardProps) {
  return (
    <Link
      href={`/resume/${resumeId}`}
      className="group block"
    >
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
        <h3 className="text-lg font-semibold text-black group-hover:underline">
          {name}
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Last updated: {updatedAt}
        </p>

        <p className="mt-4 text-sm font-medium text-gray-700">
          Open Resume →
        </p>
      </div>
    </Link>
  );
}