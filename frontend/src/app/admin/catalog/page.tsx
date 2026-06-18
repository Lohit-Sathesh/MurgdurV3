import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'
import { CatalogClient } from '@/components/admin/CatalogClient'

interface CategoryNode {
  id: string; name: string; slug: string; children?: CategoryNode[]
}

function flattenCategories(tree: CategoryNode[], prefix = ''): { id: string; label: string; slug: string; hasChildren: boolean }[] {
  const result: { id: string; label: string; slug: string; hasChildren: boolean }[] = []
  for (const node of tree) {
    const hasChildren = !!node.children?.length
    result.push({ id: node.id, label: prefix ? `${prefix} > ${node.name}` : node.name, slug: node.slug, hasChildren })
    if (node.children?.length) {
      result.push(...flattenCategories(node.children, prefix ? `${prefix} > ${node.name}` : node.name))
    }
  }
  return result
}

export default async function CatalogAdminPage() {
  const session = await getServerSession(authOptions)
  const headers = { Authorization: `Bearer ${(session as any)?.accessToken}` }

  let products: any[] = []
  let categoryTree: CategoryNode[] = []

  try {
    const [pRes, cRes] = await Promise.all([
      api.get('/admin/products', { headers }),
      api.get('/products/categories'),
    ])
    products     = pRes.data ?? []
    categoryTree = cRes.data ?? []
  } catch {}

  const flatCategories    = flattenCategories(categoryTree)
  const productCategories = flatCategories.filter(c => !c.hasChildren)

  return (
    <section>
      <h1 className="font-serif text-4xl tracking-luxury mb-8">Catalog Management</h1>
      <CatalogClient
        products={products}
        allCategories={flatCategories}
        productCategories={productCategories}
      />
    </section>
  )
}
