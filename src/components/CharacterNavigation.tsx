type CharacterNavigationProps = {
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function CharacterNavigation({
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext
}: CharacterNavigationProps) {
  return (
    <div className="character-navigation" aria-label="글자 이동">
      <button
        type="button"
        className="navigation-button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label="이전 글자로 이동"
      >
        이전 글자
      </button>
      <button
        type="button"
        className="navigation-button"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="다음 글자로 이동"
      >
        다음 글자
      </button>
    </div>
  );
}

