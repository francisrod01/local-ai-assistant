import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <section className="m-0 p-0 mb-4 bg-transparent shadow-none">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      </div>
      {description ? (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
      ) : null}
    </section>
  );
}
