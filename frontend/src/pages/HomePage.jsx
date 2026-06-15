import { CatalogProductCard } from "../components/CatalogProductCard";
import { HomeHero } from "../components/HomeHero";
import { PageError } from "../components/PageError";
import { TrustStrip } from "../components/TrustStrip";
import { useHomeCatalog } from "../hooks/useHomeCatalog";

function HomePage() {
  const {
    products,
    categories,
    categoryChipsLoading,
    categoryFilter,
    error,
    loadingCategories,
    loadingList,
    setCategory,
  } = useHomeCatalog();

  let catalogContent;
  if (loadingList) {
    catalogContent = (
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <li key={i}>
            <div className="skeleton h-96 w-full rounded-box" />
          </li>
        ))}
      </ul>
    );
  } else if (error) {
    catalogContent = (
      <PageError message="We couldn't load products. Please try again in a moment." />
    );
  } else if (products.length === 0) {
    catalogContent = (
      <div className="rounded-box border border-base-300 bg-base-100 py-16 text-center text-base-content/60">
        No products in this category yet.
      </div>
    );
  } else {
    catalogContent = (
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <li key={p.id}>
            <CatalogProductCard product={p} />
          </li>
        ))}
      </ul>
    );
  }

  // 👇 Category chips bhi independent statement
  let categoryButtons;
  if (categoryChipsLoading) {
    categoryButtons = [1, 2, 3, 4].map((i) => (
      <div key={i} className="skeleton h-8 w-20 rounded-lg" aria-hidden />
    ));
  } else {
    categoryButtons = categories.map((c) => (
      <button
        key={c}
        type="button"
        className={`btn btn-sm ${
          categoryFilter === c
            ? "btn-primary"
            : "btn-ghost border border-base-300"
        }`}
        onClick={() => setCategory(c)}>
        {c}
      </button>
    ));
  }

  return (
    <div className="space-y-12">
      <HomeHero categories={categories} loadingCategories={loadingCategories} />

      <TrustStrip />

      {/* CATALOG */}
      <section id="catalog" className="scroll-mt-24">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-base-content md:text-2xl uppercase font-mono">
              Catalog
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn btn-sm ${
                categoryFilter
                  ? "btn-ghost border border-base-300"
                  : "btn-primary"
              }`}
              onClick={() => setCategory("")}>
              All
            </button>

            {categoryButtons}
          </div>
        </div>

        {catalogContent}
      </section>
    </div>
  );
}

export default HomePage;
