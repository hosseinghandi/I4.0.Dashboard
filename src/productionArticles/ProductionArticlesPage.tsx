import { useMemo, useState } from "react";
import { EmptyState } from "../components/shared/EmptyState";
import { ErrorBanner } from "../components/shared/ErrorBanner";
import { BoxIcon } from "../components/shared/BoxIcon";
import { machineDefinitionById } from "../machines";
import {
  FeaturedProductionArticleCard,
  ProductionArticleRow,
} from "./ProductionArticleCard";
import { ProductionArticleDetail } from "./ProductionArticleDetail";
import { ProductionArticleForm } from "./ProductionArticleForm";
import { deleteProductionArticle } from "./service";
import { useProductionArticles } from "./useProductionArticles";
import {
  productionArticleStateLabels,
  shortMachineNames,
  type ProductionArticle,
  type ProductionArticleState,
} from "./types";

type Dialog =
  | { type: "detail"; id: number }
  | { type: "form"; id: number | null }
  | null;

type StatusFilter = "all" | "working" | "queued" | "completed";

const statePriority: Record<ProductionArticleState, number> = {
  working: 1,
  waiting: 2,
  error: 3,
  queued: 4,
  completed: 5,
};

export function ProductionArticlesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedFeaturedId, setSelectedFeaturedId] = useState<number | null>(null);

  // Load all articles into state
  const { productionArticles, error, loaded, refresh } = useProductionArticles("");

  // Counts across all loaded articles using only CSS template palette
  const allCount = productionArticles.length;
  const workingCount = productionArticles.filter((a) => a.state === "working").length;
  const queuedCount = productionArticles.filter(
    (a) => a.state === "queued" || a.state === "waiting",
  ).length;
  const completedCount = productionArticles.filter((a) => a.state === "completed").length;

  // Real-time client-side search & status filtering across code, description, notes, machines, and quantity
  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();

    return productionArticles.filter((article) => {
      // 1. Status Filter
      if (statusFilter === "working" && article.state !== "working") return false;
      if (
        statusFilter === "queued" &&
        article.state !== "queued" &&
        article.state !== "waiting"
      )
        return false;
      if (statusFilter === "completed" && article.state !== "completed")
        return false;

      // 2. Search query filter
      if (!q) return true;

      const codeMatch = article.code.toLowerCase().includes(q);
      const descMatch = (article.description || "").toLowerCase().includes(q);
      const notesMatch = (article.notes || "").toLowerCase().includes(q);
      const qtyMatch = String(article.quantity).includes(q);
      const machineMatch = article.steps.some((step) => {
        const mid = step.machineId.toLowerCase();
        const shortName = (shortMachineNames[step.machineId] || "").toLowerCase();
        const fullName = (
          machineDefinitionById[step.machineId]?.name || ""
        ).toLowerCase();
        return (
          mid.includes(q) || shortName.includes(q) || fullName.includes(q)
        );
      });
      const stateMatch = (productionArticleStateLabels[article.state] || "")
        .toLowerCase()
        .includes(q);

      return (
        codeMatch ||
        descMatch ||
        notesMatch ||
        qtyMatch ||
        machineMatch ||
        stateMatch
      );
    });
  }, [productionArticles, search, statusFilter]);

  // Sort articles: active/working first, then queued, then completed
  const sortedArticles = useMemo(() => {
    return [...filteredArticles].sort((a, b) => {
      const priorityDiff = statePriority[a.state] - statePriority[b.state];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [filteredArticles]);

  // Determine active featured article
  const activeArticle = useMemo<ProductionArticle | null>(() => {
    if (sortedArticles.length === 0) return null;
    if (selectedFeaturedId != null) {
      const found = sortedArticles.find((a) => a.id === selectedFeaturedId);
      if (found) return found;
    }
    return sortedArticles[0];
  }, [sortedArticles, selectedFeaturedId]);

  // Subsequent articles in the list
  const subsequentArticles = useMemo(() => {
    if (!activeArticle) return [];
    return sortedArticles.filter((article) => article.id !== activeArticle.id);
  }, [sortedArticles, activeArticle]);

  const selected =
    dialog?.id != null
      ? (productionArticles.find((article) => article.id === dialog.id) ?? null)
      : null;

  const remove = async (id: number) => {
    try {
      await deleteProductionArticle(id);
      setActionError(null);
      setDialog(null);
      if (selectedFeaturedId === id) {
        setSelectedFeaturedId(null);
      }
      refresh();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Eliminazione non riuscita.",
      );
    }
  };

  return (
    <div className="space-y-3">
      {/* Compact Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-primary">
              PRODUZIONE
            </span>
            <span className="text-neutral-300">·</span>
            <h1 className="m-0 text-xl font-bold leading-tight tracking-tight text-brand-ink sm:text-2xl">
              Production Article
            </h1>
          </div>
          <p className="m-0 mt-0.5 text-xs text-neutral-500">
            Monitoraggio lotti di produzione e avanzamento macchine.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-brand-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-primary-hover cursor-pointer"
          onClick={() => setDialog({ type: "form", id: null })}
        >
          <span className="text-sm font-bold leading-none">+</span>
          <span>Nuovo Production Article</span>
        </button>
      </div>

      {/* Search Bar + Interactive Status Filters */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          {/* Robust search input with clear icon */}
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cerca per codice articolo, descrizione, macchina…"
              aria-label="Cerca Production Article"
              className="w-full rounded-lg border border-brand-border bg-white px-3.5 py-1.5 pl-9 pr-9 text-xs text-brand-ink placeholder-neutral-400 outline-none transition-colors focus:border-brand-primary focus:ring-1 focus:ring-brand-green-100"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              <svg
                className="h-3.5 w-3.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Cancella ricerca"
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-neutral-400 hover:text-brand-ink cursor-pointer transition-colors"
              >
                <span className="grid h-4 w-4 place-items-center rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[10px] font-bold leading-none">
                  ✕
                </span>
              </button>
            )}
          </div>

          {/* Interactive Filter Tabs matching reference image design strategy */}
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="tablist"
            aria-label="Filtra per stato produzione"
          >
            {[
              { key: "all" as const, label: "Tutti gli articoli", count: allCount },
              { key: "working" as const, label: "In lavorazione", count: workingCount },
              { key: "queued" as const, label: "In coda", count: queuedCount },
              { key: "completed" as const, label: "Completati", count: completedCount },
            ].map((tab) => {
              const isSelected = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`rounded-lg border px-3 py-1.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer ${
                    isSelected
                      ? "border-brand-green-700 bg-brand-primary text-white shadow-2xs"
                      : "border-brand-border bg-white text-neutral-700 hover:border-brand-primary hover:bg-brand-green-50"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono font-bold ${
                        isSelected
                          ? "bg-brand-green-800 text-white"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search status feedback */}
        {search && (
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>
              Risultati per &ldquo;<b>{search}</b>&rdquo;: {filteredArticles.length} articoli trovati
            </span>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-brand-primary hover:underline cursor-pointer"
            >
              Azzera ricerca
            </button>
          </div>
        )}
      </div>

      {(error ?? actionError) && (
        <ErrorBanner message={(error ?? actionError) as string} />
      )}

      {/* Main Content Area */}
      {loaded && sortedArticles.length === 0 ? (
        <EmptyState
          message={
            search
              ? `Nessun Production Article trovato per "${search}". Prova a cercare un altro codice o nome macchina.`
              : statusFilter !== "all"
                ? `Nessun Production Article con stato "${
                    statusFilter === "working"
                      ? "In corso"
                      : statusFilter === "queued"
                        ? "In coda"
                        : "Completati"
                  }".`
                : 'Nessun Production Article presente. Usa "+ Nuovo Production Article" per iniziare.'
          }
        />
      ) : activeArticle ? (
        <div className="space-y-4">
          {/* Section 1: Active Article with Complete Details */}
          <section aria-labelledby="active-article-heading">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <BoxIcon className="h-4 w-4 text-brand-primary" strokeWidth={1.5} />
                <h2
                  id="active-article-heading"
                  className="m-0 text-[11px] font-bold uppercase tracking-wider text-neutral-600"
                >
                  Articolo attivo in produzione
                </h2>
              </div>
              <span className="text-[10px] font-medium text-neutral-400">
                Scheda dettagliata completa
              </span>
            </div>

            <FeaturedProductionArticleCard
              productionArticle={activeArticle}
              onOpenDetail={() => setDialog({ type: "detail", id: activeArticle.id })}
              onEdit={() => setDialog({ type: "form", id: activeArticle.id })}
            />
          </section>

          {/* Section 2: Subsequent Articles as Single Lines with Clear Selection Markings */}
          {subsequentArticles.length > 0 && (
            <section aria-labelledby="subsequent-articles-heading" className="space-y-2">
              <div className="flex items-center justify-between border-t border-brand-border/40 pt-3">
                <div className="flex items-center gap-2">
                  <h2
                    id="subsequent-articles-heading"
                    className="m-0 text-[11px] font-bold uppercase tracking-wider text-neutral-600"
                  >
                    Altri articoli nel lotto ({subsequentArticles.length})
                  </h2>
                </div>
                <span className="text-[10px] font-medium text-neutral-400">
                  Clicca su un articolo per metterlo in primo piano
                </span>
              </div>

              <div className="space-y-1.5">
                {subsequentArticles.map((article) => {
                  const isSelected = article.id === activeArticle.id;
                  return (
                    <ProductionArticleRow
                      key={article.id}
                      productionArticle={article}
                      isActive={isSelected}
                      onSelect={() => setSelectedFeaturedId(article.id)}
                      onOpenDetail={() => setDialog({ type: "detail", id: article.id })}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      ) : null}

      {/* Detail Dialog */}
      {dialog?.type === "detail" && selected && (
        <ProductionArticleDetail
          productionArticle={selected}
          onClose={() => setDialog(null)}
          onEdit={() => setDialog({ type: "form", id: selected.id })}
          onDelete={() => void remove(selected.id)}
        />
      )}

      {/* Create / Edit Form Dialog */}
      {dialog?.type === "form" && (dialog.id === null || selected) && (
        <ProductionArticleForm
          productionArticle={selected}
          onClose={() =>
            setDialog(
              dialog.id === null ? null : { type: "detail", id: dialog.id },
            )
          }
          onSaved={(saved) => {
            refresh();
            setSelectedFeaturedId(saved.id);
            setDialog({ type: "detail", id: saved.id });
          }}
        />
      )}
    </div>
  );
}
