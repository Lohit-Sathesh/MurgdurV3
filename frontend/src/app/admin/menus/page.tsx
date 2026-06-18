import { api } from '@/lib/api'
import { CategoryHighlightsManager } from '@/components/admin/CategoryHighlightsManager'

interface CategoryNode {
  id: string
  name: string
  children?: CategoryNode[]
}

export default async function MenusAdminPage() {
  let categoryTree: CategoryNode[] = []
  try {
    const res = await api.get('/products/categories')
    categoryTree = res.data ?? []
  } catch {}

  const parents = categoryTree.filter(c => c.children?.length)

  return (
    <section>
      <h1 className="font-serif text-4xl tracking-luxury mb-4">Menus</h1>
      <p className="text-luxury-muted text-sm mb-10">
        Manage the image shown for each subcategory in the navigation menu.
      </p>

      {parents.length === 0 ? (
        <p className="text-luxury-muted border border-luxury-gray p-8 text-center">No categories with subcategories yet.</p>
      ) : (
        <div className="space-y-12">
          {parents.map(parent => (
            <div key={parent.id}>
              <h2 className="font-serif text-2xl tracking-luxury mb-4">{parent.name}</h2>
              <div className="space-y-8">
                {parent.children!.map(child => (
                  <CategoryHighlightsManager key={child.id} categoryId={child.id} categoryName={child.name} placement="menu" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
