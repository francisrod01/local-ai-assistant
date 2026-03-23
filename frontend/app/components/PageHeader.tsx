import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <section className="mb-4 bg-white border-b border-gray-200 px-4 py-3 shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
        {description ? (
          <p className="mt-0 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        ) : null}
      </div>
    </section>
  );
}
