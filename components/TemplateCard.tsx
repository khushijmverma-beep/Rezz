
"use client";

import Image from "next/image";

type TemplateCardProps = {
  name: string;
  templateId: string;
  onClick: () => void;
};

export default function TemplateCard({
  name,
  templateId,
  onClick,
}: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-40 shrink-0 text-left"
    >
      <div className="relative flex aspect-[8.5/11] items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-100 transition group-hover:border-gray-400 group-hover:shadow-md">
        {templateId === "blank" ? (
          <span className="text-5xl font-light text-gray-400">+</span>
        ) : (
          <Image
            src={`/templates/${templateId}.png`}
            alt={`${name} resume template preview`}
            fill
            sizes="160px"
            className="object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>

      <p className="mt-2 text-sm font-medium text-gray-800 group-hover:text-black">
        {name}
      </p>
    </button>
  );
}
