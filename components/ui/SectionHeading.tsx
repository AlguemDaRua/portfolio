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
    <div className="section-head">
      <div>
        <ScrambleText className="eyebrow" text={label} as="span" />
        <ScrambleText id={id} text={title} as="h2" />
      </div>
      {description && (
        <ScrambleText text={description} as="p" />
      )}
    </div>
  );
}
