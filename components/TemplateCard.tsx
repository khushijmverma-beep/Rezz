import Link from "next/link";

type TemplateCardProps = {
  name: string;
  thumbnail: string;
  templateId: string;
};

export default function TemplateCard({
  name,
  thumbnail,
  templateId,
}: TemplateCardProps) {
  return (
    <Link
      href={`/resume/new?template=${templateId}`}
      className="group block"
    >
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
        <div className="flex h-48 items-center justify-center bg-gray-100">
          <span className="text-sm text-gray-500">{thumbnail}</span>
        </div>

        <div className="p-5">
          <h3 className="text-lg font-semibold text-black group-hover:underline">
            {name}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Choose this template
          </p>
        </div>
      </div>
    </Link>
  );
}