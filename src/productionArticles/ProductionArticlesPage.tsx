import { useState } from "react";
import { EmptyState } from "../components/shared/EmptyState";
import { ErrorBanner } from "../components/shared/ErrorBanner";
import { PageHeading } from "../components/shared/PageHeading";
import { ProductionArticleCard } from "./ProductionArticleCard";
import { ProductionArticleDetail } from "./ProductionArticleDetail";
import { ProductionArticleForm } from "./ProductionArticleForm";
import { deleteProductionArticle } from "./service";
import { useProductionArticles } from "./useProductionArticles";

type Dialog =
  | { type: "detail"; id: number }
  | { type: "form"; id: number | null }
  | null;

export function ProductionArticlesPage() {
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { productionArticles, error, loaded, refresh } = useProductionArticles(
    search.trim(),
  );

  const selected =
    dialog?.id != null
      ? (productionArticles.find((article) => article.id === dialog.id) ?? null)
      : null;

  const remove = async (id: number) => {
    try {
      await deleteProductionArticle(id);
      setActionError(null);
      setDialog(null);
      refresh();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Eliminazione non riuscita.",
      );
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="PRODUZIONE"
        title="Production Article"
        description="Introduci un Production Article, definisci il percorso delle macchine e segui lo stato di avanzamento."
        aside={
          <button
            type="button"
            className="rounded-md bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-hover"
            onClick={() => setDialog({ type: "form", id: null })}
          >
            + Nuovo Production Article
          </button>
        }
      />
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Cerca un Production Article per codice o descrizione…"
        aria-label="Cerca Production Article"
        className="mb-4 w-full rounded-md border border-brand-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-primary"
      />
      {(error ?? actionError) && (
        <ErrorBanner message={(error ?? actionError) as string} />
      )}
      {loaded && productionArticles.length === 0 ? (
        <EmptyState
          message={
            search
              ? "Nessun Production Article trovato. Prova con un altro termine di ricerca."
              : 'Nessun Production Article introdotto. Usa "Nuovo Production Article" per iniziare.'
          }
        />
      ) : (
        <div className="grid grid-cols-1">
          {productionArticles.map((article) => (
            <ProductionArticleCard
              key={article.id}
              productionArticle={article}
              onOpen={() => setDialog({ type: "detail", id: article.id })}
            />
          ))}
        </div>
      )}

      {dialog?.type === "detail" && selected && (
        <ProductionArticleDetail
          productionArticle={selected}
          onClose={() => setDialog(null)}
          onEdit={() => setDialog({ type: "form", id: selected.id })}
          onDelete={() => void remove(selected.id)}
        />
      )}
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
            setDialog({ type: "detail", id: saved.id });
          }}
        />
      )}
    </>
  );
}
