import { and, desc, eq, isNotNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { applications, namespaces, wishlist } from "@/lib/db/schema"
import { requireNamespaceId } from "@/lib/auth/session"
import { getResumes } from "@/app/actions/resumes"
import { WishlistClient } from "@/components/wishlist-client"

export default async function WishlistPage() {
  const currentNamespaceId = await requireNamespaceId()

  const [
    allNamespaces,
    resumes,
    sharedWishlist,
    claims,
  ] = await Promise.all([
    db.select().from(namespaces),
    getResumes(),
    db
      .select()
      .from(wishlist)
      .orderBy(desc(wishlist.createdAt)),
    db
      .select({
        id: applications.id,
        namespaceId: applications.namespaceId,
        wishlistId: applications.wishlistId,
        status: applications.status,
      })
      .from(applications)
      .where(isNotNull(applications.wishlistId)),
  ])

  // Cast wishlistId as non-null since we filtered for it in the query
  const safeClaims = claims.map((c) => ({
    ...c,
    wishlistId: c.wishlistId!,
  }))

  return (
    <WishlistClient
      currentNamespaceId={currentNamespaceId}
      namespaces={allNamespaces}
      resumes={resumes}
      sharedWishlist={sharedWishlist}
      claims={safeClaims}
    />
  )
}
