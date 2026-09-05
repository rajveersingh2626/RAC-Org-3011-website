interface RichTextProps {
  html: string;
  className?: string;
}

export function RichText({ html, className }: RichTextProps) {
  return (
    <div
      className={className ?? 'prose-basic max-w-none text-[13.5px] leading-relaxed text-fg-2 [&_a]:font-bold [&_a]:text-accent [&_h2]:mt-6 [&_h2]:text-[19px] [&_h2]:font-extrabold [&_h2]:text-fg [&_p]:mb-3'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
