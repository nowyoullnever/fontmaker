import { useEffect, useMemo, useRef, useState } from "react";
import { FONT_CHARACTERS } from "../data/characterSet";
import {
  CHARACTER_LIST_CATEGORIES,
  CHARACTER_LIST_PAGE_SIZE,
  type CharacterListCategoryFilter,
  type CompletionFilter,
  filterCharactersForList,
  paginateCharacters,
  searchExactCharacter
} from "../management/characterManagement";

type CharacterListDialogProps = {
  activeCodePoint: number;
  completedCodePoints: Set<number>;
  onClose: () => void;
  onSelectCharacter: (globalIndex: number) => void;
};

const STATUS_FILTERS: Array<{ id: CompletionFilter; label: string }> = [
  { id: "all", label: "전체" },
  { id: "incomplete", label: "미완성" },
  { id: "completed", label: "완료" }
];

export function CharacterListDialog({
  activeCodePoint,
  completedCodePoints,
  onClose,
  onSelectCharacter
}: CharacterListDialogProps) {
  const [categoryFilter, setCategoryFilter] =
    useState<CharacterListCategoryFilter>("all");
  const [completionFilter, setCompletionFilter] =
    useState<CompletionFilter>("all");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const searchResult = useMemo(
    () => searchExactCharacter(searchInput),
    [searchInput]
  );

  const filteredCharacters = useMemo(() => {
    if (searchResult.status === "found") {
      return [searchResult.character];
    }

    if (searchResult.status === "multiple" || searchResult.status === "unknown") {
      return [];
    }

    return filterCharactersForList(
      FONT_CHARACTERS,
      categoryFilter,
      completionFilter,
      completedCodePoints
    );
  }, [categoryFilter, completionFilter, completedCodePoints, searchResult]);

  const pagination = paginateCharacters(
    filteredCharacters,
    page,
    CHARACTER_LIST_PAGE_SIZE
  );

  const resetToFirstPage = () => setPage(1);

  return (
    <div className="dialog-backdrop" role="presentation">
      <div
        ref={dialogRef}
        className="character-list-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="글자 목록"
        tabIndex={-1}
      >
        <header className="dialog-header">
          <h2>글자 목록</h2>
          <button type="button" className="icon-text-button" onClick={onClose}>
            닫기
          </button>
        </header>

        <label className="search-label">
          <span>글자 한 개 찾기</span>
          <input
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              resetToFirstPage();
            }}
            placeholder="글자 한 개 찾기"
          />
        </label>

        {searchResult.status === "multiple" ? (
          <p className="inline-error">한 글자만 입력해 주세요.</p>
        ) : null}
        {searchResult.status === "unknown" ? (
          <p className="inline-error">목록에 없는 글자입니다.</p>
        ) : null}

        <div className="dialog-tabs" aria-label="범주 필터">
          {CHARACTER_LIST_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={categoryFilter === category.id}
              onClick={() => {
                setCategoryFilter(category.id);
                resetToFirstPage();
              }}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="dialog-tabs" aria-label="완료 필터">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={completionFilter === filter.id}
              onClick={() => {
                setCompletionFilter(filter.id);
                resetToFirstPage();
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="character-grid">
          {pagination.items.map((character) => {
            const isCompleted = completedCodePoints.has(character.codePoint);
            const isActive = character.codePoint === activeCodePoint;

            return (
              <button
                key={character.globalIndex}
                type="button"
                className="character-cell"
                aria-pressed={isActive}
                onClick={() => onSelectCharacter(character.globalIndex)}
              >
                <span>{character.character}</span>
                {isCompleted ? <strong aria-label="완료">✓</strong> : null}
              </button>
            );
          })}
        </div>

        <footer className="pagination-controls">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={pagination.currentPage === 1}
          >
            이전 페이지
          </button>
          <span>
            {pagination.currentPage} / {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              setPage((current) =>
                Math.min(pagination.totalPages, current + 1)
              )
            }
            disabled={pagination.currentPage === pagination.totalPages}
          >
            다음 페이지
          </button>
        </footer>
      </div>
    </div>
  );
}

