type CharacterCanvasPlaceholderProps = {
  character: string;
  categoryLabel: string;
};

export function CharacterCanvasPlaceholder({
  character,
  categoryLabel
}: CharacterCanvasPlaceholderProps) {
  return (
    <section
      className="workspace"
      aria-label={`${categoryLabel} ${character} 글자 연습 영역`}
    >
      <div className="guide-line guide-line-horizontal" aria-hidden="true" />
      <div className="guide-line guide-line-vertical" aria-hidden="true" />
      <span className="workspace-character" aria-hidden="true">
        {character}
      </span>
    </section>
  );
}

