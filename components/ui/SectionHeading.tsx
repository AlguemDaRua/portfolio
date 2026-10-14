interface SectionHeadingProps {
  id: string;
  label: string;
  title: string;
  description?: string;
}

export function SectionHeading({
  id,
  label,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{label}</span>
        <h2 id={id}>{title}</h2>
      </div>
      {description && <p>{description}</p>}
    </div>
  );
}
