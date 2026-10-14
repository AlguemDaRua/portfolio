import { ScrambleText } from "@/components/ui/ScrambleText";

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
        <span className="eyebrow">
          <ScrambleText text={label} />
        </span>
        <h2 id={id}>
          <ScrambleText text={title} />
        </h2>
      </div>
      {description && (
        <p>
          <ScrambleText text={description} />
        </p>
      )}
    </div>
  );
}
