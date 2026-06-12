import { and, desc, eq, isNotNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { applications, namespaces, wishlist } from "@/lib/db/schema"
import { getSession, isSectionAllowed } from "@/lib/auth/session"
import { getResumes } from "@/app/actions/resumes"
import { WishlistClient } from "@/components/wishlist-client"
import { AccessRestricted } from "@/components/access-restricted"

export default async function WishlistPage() {
  const session = await getSession()
  if (!isSectionAllowed(session, "wishlist")) {
    return <AccessRestricted />
  }

  const currentNamespaceId = session.namespaceId!

  const [
    allNamespaces,
    resumes,
    sharedWishlist,
    claims,
  ] = await Promise.all([
    db.select().from(namespaces),
    isSectionAllowed(session, "resumes") ? getResumes() : Promise.resolve([]),
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
