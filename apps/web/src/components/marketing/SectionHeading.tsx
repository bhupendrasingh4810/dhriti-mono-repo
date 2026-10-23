interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description: string;
}

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <section className="flex flex-col items-start gap-1.5">
      {eyebrow ? <p className="text-xs font-extrabold uppercase text-brand">{eyebrow}</p> : null}
      <h2 className="text-3xl font-extrabold text-text-primary">{title}</h2>
      <p className="max-w-[40rem] text-base text-text-secondary">{description}</p>
    </section>
  );
}
