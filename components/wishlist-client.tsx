"use client"

import { useMemo, useState, useTransition, useEffect } from "react"
import type { Resume, Namespace, WishlistItem } from "@/lib/db/schema"
import { PRIORITY_META } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import MonksButton from "@/components/MonksButton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Trash2,
  Pencil,
  ExternalLink,
  MapPin,
  Check,
  Plus,
  FileJson,
  X,
  FileText,
  UserCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { WishlistFormDialog } from "@/components/wishlist-form-dialog"
import {
  claimWishlistItem,
  deleteWishlistItem,
  importWishlistItems,
  renameWishlistCategory,
  deleteWishlistCategory,
} from "@/app/actions/wishlist"

interface WishlistClientProps {
  currentNamespaceId: number
  namespaces: Namespace[]
  resumes: Resume[]
  sharedWishlist: WishlistItem[]
  claims: {
    id: number
    namespaceId: number
    wishlistId: number
    status: string
  }[]
}

export function WishlistClient({
  currentNamespaceId,
  namespaces,
  resumes,
  sharedWishlist,
  claims,
}: WishlistClientProps) {
  const [pending, startTransition] = useTransition()

  // Categories & Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [addedByFilter, setAddedByFilter] = useState("all")
  const [claimFilter, setClaimFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")

  // Add Category State
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  // Edit Category State
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false)

  // Edit/Dialog State
  const [editingItem, setEditingItem] = useState<WishlistItem | undefined>(undefined)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [jsonText, setJsonText] = useState("")

  // Namespace Mapping
  const namespaceMap = useMemo(() => {
    return new Map(namespaces.map((n) => [n.id, n.displayName]))
  }, [namespaces])

  // Load custom categories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("huntboard-wishlist-categories")
    if (saved) {
      try {
        setCustomCategories(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) return

    if (
      trimmed.toLowerCase() === "all" ||
      trimmed.toLowerCase() === "uncategorized" ||
      customCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())
    ) {
      toast.error("Category already exists or is reserved.")
      return
    }

    const updated = [...customCategories, trimmed]
    setCustomCategories(updated)
    localStorage.setItem("huntboard-wishlist-categories", JSON.stringify(updated))
    setNewCategoryName("")
    setIsAddingCategory(false)
    toast.success(`Category "${trimmed}" added to filter list`)
  }

  const handleDeleteCategory = (cat: string) => {
    if (
      confirm(
        `Are you sure you want to delete the category "${cat}"? This will clear the category from all jobs.`
      )
    ) {
      startTransition(async () => {
        try {
          const updated = customCategories.filter((c) => c.toLowerCase() !== cat.toLowerCase())
          setCustomCategories(updated)
          localStorage.setItem("huntboard-wishlist-categories", JSON.stringify(updated))

          await deleteWishlistCategory(cat)

          if (selectedCategory.toLowerCase() === cat.toLowerCase()) {
            setSelectedCategory("all")
          }

          toast.success(`Category "${cat}" deleted`)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Delete failed")
        }
      })
    }
  }

  const handleRenameCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedOld = editingCategory ? editingCategory.trim() : ""
    const trimmedNew = editCategoryName.trim()

    if (!trimmedOld || !trimmedNew) return
    if (trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) {
      setIsEditCategoryDialogOpen(false)
      return
    }

    if (
      trimmedNew.toLowerCase() === "all" ||
      trimmedNew.toLowerCase() === "uncategorized" ||
      customCategories.some(
        (c) =>
          c.toLowerCase() === trimmedNew.toLowerCase() &&
          c.toLowerCase() !== trimmedOld.toLowerCase()
      )
    ) {
      toast.error("Category already exists or is reserved.")
      return
    }

    startTransition(async () => {
      try {
        let updated = customCategories.map((c) =>
          c.toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : c
        )
        if (!customCategories.some((c) => c.toLowerCase() === trimmedOld.toLowerCase())) {
          updated.push(trimmedNew)
        }
        setCustomCategories(updated)
        localStorage.setItem("huntboard-wishlist-categories", JSON.stringify(updated))

        await renameWishlistCategory(trimmedOld, trimmedNew)

        if (selectedCategory.toLowerCase() === trimmedOld.toLowerCase()) {
          setSelectedCategory(trimmedNew.toLowerCase())
        }

        setIsEditCategoryDialogOpen(false)
        setEditingCategory(null)
        toast.success(`Category renamed to "${trimmedNew}"`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Rename failed")
      }
    })
  }

  // Calculate unique categories and job counts
  const categoryStats = useMemo(() => {
    const stats: { [key: string]: number } = { all: sharedWishlist.length }
    let uncategorizedCount = 0

    sharedWishlist.forEach((item) => {
      const cat = item.category?.trim()
      if (cat) {
        const lower = cat.toLowerCase()
        stats[lower] = (stats[lower] || 0) + 1
      } else {
        uncategorizedCount++
      }
    })

    stats["uncategorized"] = uncategorizedCount
    return stats
  }, [sharedWishlist])

  // Combined sorted list of categories
  const allCategoriesList = useMemo(() => {
    const dbCats = new Set<string>()
    sharedWishlist.forEach((item) => {
      const cat = item.category?.trim()
      if (cat) dbCats.add(cat)
    })

    const combined = new Set([...dbCats, ...customCategories])
    return Array.from(combined).sort((a, b) => a.localeCompare(b))
  }, [sharedWishlist, customCategories])

  // Group claims by wishlist item
  const claimsByWishlistItem = useMemo(() => {
    const map: { [key: number]: typeof claims } = {}
    claims.forEach((claim) => {
      if (!map[claim.wishlistId]) {
        map[claim.wishlistId] = []
      }
      map[claim.wishlistId].push(claim)
    })
    return map
  }, [claims])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...sharedWishlist]

    // Category Filter
    if (selectedCategory !== "all") {
      if (selectedCategory === "uncategorized") {
        result = result.filter((item) => !item.category?.trim())
      } else {
        result = result.filter(
          (item) =>
            item.category?.trim().toLowerCase() === selectedCategory.toLowerCase()
        )
      }
    }

    // Search Query
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (item) =>
          item.company.toLowerCase().includes(q) ||
          (item.role ?? "").toLowerCase().includes(q) ||
          (item.location ?? "").toLowerCase().includes(q) ||
          (item.notes ?? "").toLowerCase().includes(q)
      )
    }

    // Priority Filter
    if (priorityFilter !== "all") {
      result = result.filter((item) => (item.priority ?? "medium") === priorityFilter)
    }

    // Added By Filter
    if (addedByFilter !== "all") {
      result = result.filter((item) => String(item.addedByNamespaceId) === addedByFilter)
    }

    // Claim Filter
    if (claimFilter !== "all") {
      result = result.filter((item) => {
        const itemClaims = claimsByWishlistItem[item.id] || []
        const hasMyClaim = itemClaims.some((c) => c.namespaceId === currentNamespaceId)
        const hasOthersClaim = itemClaims.some((c) => c.namespaceId !== currentNamespaceId)

        if (claimFilter === "unclaimed") return itemClaims.length === 0
        if (claimFilter === "claimed-by-me") return hasMyClaim
        if (claimFilter === "claimed-by-others") return hasOthersClaim
        return true
      })
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.createdAt ?? "").getTime() - new Date(a.createdAt ?? "").getTime()
      }
      if (sortBy === "date-asc") {
        return new Date(a.createdAt ?? "").getTime() - new Date(b.createdAt ?? "").getTime()
      }
      if (sortBy === "priority-desc") {
        const priorityVal = { high: 3, medium: 2, low: 1 }
        return (
          (priorityVal[b.priority as "high" | "medium" | "low"] ?? 2) -
          (priorityVal[a.priority as "high" | "medium" | "low"] ?? 2)
        )
      }
      if (sortBy === "priority-asc") {
        const priorityVal = { high: 3, medium: 2, low: 1 }
        return (
          (priorityVal[a.priority as "high" | "medium" | "low"] ?? 2) -
          (priorityVal[b.priority as "high" | "medium" | "low"] ?? 2)
        )
      }
      if (sortBy === "company-asc") {
        return a.company.localeCompare(b.company)
      }
      if (sortBy === "company-desc") {
        return b.company.localeCompare(a.company)
      }
      return 0
    })

    return result
  }, [
    sharedWishlist,
    selectedCategory,
    searchQuery,
    priorityFilter,
    addedByFilter,
    claimFilter,
    sortBy,
    claimsByWishlistItem,
    currentNamespaceId,
  ])

  // Handlers
  const handleDeleteShared = (id: number) => {
    if (confirm("Are you sure you want to delete this shared item?")) {
      startTransition(async () => {
        try {
          await deleteWishlistItem(id)
          toast.success("Item deleted")
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Delete failed")
        }
      })
    }
  }

  const handleClaimItem = (id: number, type: "apply" | "wishlist") => {
    startTransition(async () => {
      try {
        await claimWishlistItem(id, type)
        toast.success(
          type === "apply"
            ? "Added to your applied jobs"
            : "Added to your wishlist"
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Claim failed")
      }
    })
  }

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonText)
      const items = Array.isArray(parsed) ? parsed : [parsed]

      if (items.length === 0) {
        toast.error("JSON array is empty")
        return
      }

      // If a specific category is active, default the imported items to it if they don't specify one
      const defaultCategory = (selectedCategory !== "all" && selectedCategory !== "uncategorized")
        ? selectedCategory
        : undefined

      const itemsToImport = items.map((it) => {
        if (!it.company && !it.Company && !it.company_name) {
          throw new Error("Each item must contain at least a 'company' field.")
        }
        
        const hasCategory = it.category || it.Category
        if (!hasCategory && defaultCategory) {
          return { ...it, category: defaultCategory }
        }
        return it
      })

      startTransition(async () => {
        try {
          await importWishlistItems(itemsToImport)
          toast.success(`Successfully imported ${itemsToImport.length} jobs!`)
          setIsImportDialogOpen(false)
          setJsonText("")
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Import failed")
        }
      })
    } catch (e) {
      toast.error(
        e instanceof Error && !e.message.startsWith("Unexpected token")
          ? e.message
          : "Invalid JSON format. Check brackets and commas."
      )
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Blueprint Header */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between relative">
        <div className="absolute top-0 right-0 font-mono text-[9px] text-muted-foreground/40 uppercase tracking-widest hidden sm:block">
          [04_OPPORTUNITY_LOG]
        </div>
        <div>
          <h1 className="text-3xl font-heading font-black tracking-tight uppercase">
            Wishlist Board
          </h1>
          <p className="text-xs font-mono text-muted-foreground uppercase mt-1">
            Group opportunity log / Interactive job pipeline builder
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
            className="h-9 rounded-none font-mono text-xs uppercase border-border hover:bg-muted/40"
          >
            <FileJson className="mr-2 h-4 w-4 text-muted-foreground" />
            Import JSON
          </Button>

          <MonksButton
            label="Share Role"
            variant="primary"
            className="h-9"
            onClick={() => {
              setEditingItem(undefined)
              setIsItemDialogOpen(true)
            }}
          />
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* ================= LEFT COLUMN: CATEGORIES LIST ================= */}
        <div className="w-full lg:w-[260px] shrink-0 border border-border/60 bg-card/60 p-4 relative overflow-hidden">
          <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />
          <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-4">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              [01_CATEGORIES]
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {/* Category: ALL */}
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-xs font-mono text-left uppercase border rounded-none transition-colors w-full",
                selectedCategory === "all"
                  ? "bg-foreground text-background border-foreground font-bold"
                  : "border-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <span>[all_jobs]</span>
              <span>({categoryStats.all || 0})</span>
            </button>

            {/* Category: Uncategorized */}
            <button
              onClick={() => setSelectedCategory("uncategorized")}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-xs font-mono text-left uppercase border rounded-none transition-colors w-full",
                selectedCategory === "uncategorized"
                  ? "bg-foreground text-background border-foreground font-bold"
                  : "border-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground"
              )}
            >
              <span>[uncategorized]</span>
              <span>({categoryStats.uncategorized || 0})</span>
            </button>

            <div className="h-px bg-border/40 my-2" />

            {/* Sorted Categories List */}
            {allCategoriesList.map((cat) => {
              const lower = cat.toLowerCase()
              const count = categoryStats[lower] || 0
              const isActive = selectedCategory.toLowerCase() === lower

              return (
                <div key={cat} className="group/cat flex items-center justify-between w-full">
                  <button
                    onClick={() => setSelectedCategory(lower)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-xs font-mono text-left border rounded-none transition-colors grow truncate",
                      isActive
                        ? "bg-foreground text-background border-foreground font-bold"
                        : "border-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                    )}
                    title={cat}
                  >
                    <span className="truncate">[{lower}]</span>
                    <span className="shrink-0 ml-1">({count})</span>
                  </button>
                  
                  {/* Category Actions on Hover */}
                  <div className="hidden group-hover/cat:flex items-center bg-card border border-border border-l-0 shrink-0 select-none">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingCategory(cat)
                        setEditCategoryName(cat)
                        setIsEditCategoryDialogOpen(true)
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground border-r border-border h-8 w-8 flex items-center justify-center transition-colors"
                      title="Rename Category"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCategory(cat)
                      }}
                      className="p-1.5 text-muted-foreground hover:text-destructive h-8 w-8 flex items-center justify-center transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Category Section */}
          <div className="mt-6 border-t border-border/40 pt-4">
            {isAddingCategory ? (
              <form onSubmit={handleAddCategorySubmit} className="flex flex-col gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. alvis-wish"
                  required
                  autoFocus
                  className="h-8 text-xs font-mono rounded-none bg-background border-border"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddingCategory(false)}
                    className="h-7 px-2 text-[10px] uppercase font-mono rounded-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-7 px-3 text-[10px] uppercase font-mono rounded-none bg-foreground text-background hover:bg-foreground/90"
                  >
                    Save
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsAddingCategory(true)}
                className="w-full h-8 text-[10px] uppercase font-mono rounded-none border-dashed border-border/80 hover:bg-muted/40 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3 w-3" />
                Add Category
              </Button>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: WISHLIST TABLE ================= */}
        <div className="flex-1 w-full border border-border/60 bg-card p-6 relative overflow-hidden min-h-[500px]">
          <div className="absolute inset-0 dot-matrix-mesh opacity-[0.03] pointer-events-none" />

          {/* Table Header / Stats Bar */}
          <div className="flex items-center justify-between relative z-10 mb-4 pb-2 border-b border-border/40">
            <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
              [viewing_category: {selectedCategory.toUpperCase()}]
            </span>
            <Badge variant="secondary" className="px-2 py-0 rounded-none font-mono text-[10px] uppercase border bg-muted/40">
              {filteredItems.length} Roles Found
            </Badge>
          </div>

          {/* Table Toolbar / Controls */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between relative z-10 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company, role, or location..."
                className="pl-9 bg-background/50 h-9 text-xs font-mono rounded-none border-border focus-visible:ring-foreground"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
              {/* Filter Priority */}
              <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val ?? "all")}>
                <SelectTrigger className="h-9 bg-background/50 text-[10px] uppercase font-mono rounded-none border-border">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="rounded-none text-xs">
                  <SelectItem value="all">Priority: All</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Added By */}
              <Select value={addedByFilter} onValueChange={(val) => setAddedByFilter(val ?? "all")}>
                <SelectTrigger className="h-9 bg-background/50 text-[10px] uppercase font-mono rounded-none border-border">
                  <SelectValue placeholder="Added By" />
                </SelectTrigger>
                <SelectContent className="rounded-none text-xs">
                  <SelectItem value="all">Added By: All</SelectItem>
                  {namespaces.map((ns) => (
                    <SelectItem key={ns.id} value={String(ns.id)}>
                      {ns.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter Claim status */}
              <Select value={claimFilter} onValueChange={(val) => setClaimFilter(val ?? "all")}>
                <SelectTrigger className="h-9 bg-background/50 text-[10px] uppercase font-mono rounded-none border-border">
                  <SelectValue placeholder="Claim Status" />
                </SelectTrigger>
                <SelectContent className="rounded-none text-xs">
                  <SelectItem value="all">Claims: All</SelectItem>
                  <SelectItem value="unclaimed">Unclaimed</SelectItem>
                  <SelectItem value="claimed-by-me">Claimed By Me</SelectItem>
                  <SelectItem value="claimed-by-others">Claimed By Others</SelectItem>
                </SelectContent>
              </Select>

              {/* Sorting */}
              <Select value={sortBy} onValueChange={(val) => setSortBy(val ?? "date-desc")}>
                <SelectTrigger className="h-9 bg-background/50 text-[10px] uppercase font-mono rounded-none border-border">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="rounded-none text-xs">
                  <SelectItem value="date-desc">Newest Added</SelectItem>
                  <SelectItem value="date-asc">Oldest Added</SelectItem>
                  <SelectItem value="priority-desc">Priority: H to L</SelectItem>
                  <SelectItem value="priority-asc">Priority: L to H</SelectItem>
                  <SelectItem value="company-asc">Company: A to Z</SelectItem>
                  <SelectItem value="company-desc">Company: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Container */}
          <div className="relative z-10 w-full overflow-x-auto border border-border/60">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 font-mono text-xs text-muted-foreground">
                <FileText className="h-8 w-8 text-muted-foreground/40 mb-3 stroke-[1.5]" />
                <p className="font-semibold">NO WISHLIST RECORDS REGISTERED</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Adjust filters or click &quot;Share Role&quot; / &quot;Import JSON&quot; above.
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 uppercase text-[10px] tracking-wider text-muted-foreground font-semibold">
                    <th className="py-3 px-4 w-[60px] border-r border-border/30">[idx]</th>
                    <th className="py-3 px-4 border-r border-border/30">Company</th>
                    <th className="py-3 px-4 border-r border-border/30">Role</th>
                    <th className="py-3 px-4 border-r border-border/30">Location</th>
                    <th className="py-3 px-4 border-r border-border/30">Priority</th>
                    <th className="py-3 px-4 border-r border-border/30">Shared By</th>
                    <th className="py-3 px-4 border-r border-border/30">Claims</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredItems.map((item, index) => {
                    const idxStr = String(index + 1).padStart(2, "0")
                    const isCreator = item.addedByNamespaceId === currentNamespaceId
                    const prio = item.priority as "low" | "medium" | "high"
                    const prioMeta = PRIORITY_META[prio] || PRIORITY_META.medium

                    // Claims analysis
                    const itemClaims = claimsByWishlistItem[item.id] || []
                    const myClaim = itemClaims.find((c) => c.namespaceId === currentNamespaceId)
                    const otherClaims = itemClaims.filter((c) => c.namespaceId !== currentNamespaceId)

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-muted/20 transition-colors group"
                      >
                        {/* Index */}
                        <td className="py-3.5 px-4 font-mono text-muted-foreground/60 border-r border-border/30 w-[60px]">
                          [{idxStr}]
                        </td>

                        {/* Company */}
                        <td className="py-3.5 px-4 font-bold text-foreground border-r border-border/30">
                          {item.company}
                        </td>

                        {/* Role & Category */}
                        <td className="py-3.5 px-4 border-r border-border/30">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="font-semibold text-foreground">{item.role || "Unknown Role"}</span>
                            {item.category && (
                              <Badge className="bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/10 text-[9px] px-1 py-0 rounded-none lowercase font-mono">
                                tag: {item.category}
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-muted-foreground border-r border-border/30">
                          {item.location || "N/A"}
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4 border-r border-border/30">
                          <Badge className={cn("rounded-none text-[9px] uppercase font-mono px-1.5 py-0 border", prioMeta.badge)}>
                            {prioMeta.label}
                          </Badge>
                        </td>

                        {/* Shared By */}
                        <td className="py-3.5 px-4 text-muted-foreground border-r border-border/30 text-[10px] uppercase">
                          {namespaceMap.get(item.addedByNamespaceId) || "system"}
                        </td>

                        {/* Claims */}
                        <td className="py-3.5 px-4 border-r border-border/30">
                          <div className="flex flex-col gap-1.5 items-start">
                            {myClaim ? (
                              myClaim.status === "applied" ? (
                                <Badge className="bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 rounded-none text-[9px] uppercase font-bold">
                                  Applied ✓
                                </Badge>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Badge className="bg-indigo-500/10 hover:bg-indigo-500/10 text-indigo-600 border border-indigo-500/30 rounded-none text-[9px] uppercase font-bold">
                                    Wishlisted ✓
                                  </Badge>
                                  <Button
                                    size="sm"
                                    onClick={() => handleClaimItem(item.id, "apply")}
                                    className="h-5 px-1.5 text-[8px] font-mono rounded-none uppercase bg-foreground text-background hover:bg-foreground/80"
                                    disabled={pending}
                                  >
                                    Applied
                                  </Button>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  onClick={() => handleClaimItem(item.id, "wishlist")}
                                  className="h-5 px-1.5 text-[8px] font-mono rounded-none border border-border/60 hover:bg-muted/40 uppercase"
                                  disabled={pending}
                                >
                                  + Wishlist
                                </Button>
                                <Button
                                  onClick={() => handleClaimItem(item.id, "apply")}
                                  className="h-5 px-1.5 text-[8px] font-mono rounded-none bg-foreground text-background hover:bg-foreground/80 uppercase"
                                  disabled={pending}
                                >
                                  + Applied
                                </Button>
                              </div>
                            )}

                            {/* Other claims details */}
                            {otherClaims.length > 0 && (
                              <span className="text-[8px] text-muted-foreground/60 uppercase">
                                claimed by: {otherClaims.map(c => namespaceMap.get(c.namespaceId) || "friend").join(", ")}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground inline-flex items-center justify-center border border-transparent hover:border-border/60"
                                title="Open Link"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <button
                              className="h-6 w-6 text-muted-foreground hover:text-foreground inline-flex items-center justify-center border border-transparent hover:border-border/60"
                              onClick={() => {
                                setEditingItem(item)
                                setIsItemDialogOpen(true)
                              }}
                              title="Edit Item"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            {isCreator && (
                              <button
                                className="h-6 w-6 text-muted-foreground hover:text-destructive inline-flex items-center justify-center border border-transparent hover:border-border/60"
                                onClick={() => handleDeleteShared(item.id)}
                                title="Delete Item"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* JSON Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg rounded-none border border-border bg-card">
          <DialogHeader className="font-mono">
            <DialogTitle className="uppercase text-sm font-bold tracking-wider">
              [02_IMPORT_WISHLIST_JSON]
            </DialogTitle>
            <DialogDescription className="text-[11px] uppercase text-muted-foreground">
              Paste a single job object or an array of jobs to import them.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 font-mono text-xs">
            <div>
              <label className="block text-[10px] text-muted-foreground uppercase mb-1">JSON Input</label>
              <Textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={`[\n  {\n    "company": "Amazon",\n    "role": "Cloud Architect",\n    "location": "Remote",\n    "priority": "high"\n  }\n]`}
                rows={10}
                className="font-mono text-xs rounded-none bg-background border-border text-foreground focus-visible:ring-foreground focus-visible:ring-1"
              />
            </div>

            <div className="bg-muted/40 border p-3">
              <span className="block text-[10px] font-bold uppercase mb-1">Expected Schema:</span>
              <ul className="list-disc pl-4 space-y-1 text-[10px] text-muted-foreground">
                <li><code className="text-foreground">company</code> (Required)</li>
                <li><code className="text-foreground">role</code>, <code className="text-foreground">location</code>, <code className="text-foreground">link</code>, <code className="text-foreground">notes</code> (Optional)</li>
                <li><code className="text-foreground">priority</code>: &quot;low&quot; | &quot;medium&quot; | &quot;high&quot;</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 border-t pt-4 border-border/40">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              className="rounded-none font-mono text-xs uppercase"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportJson}
              disabled={pending}
              className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase"
            >
              Import Jobs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-sm rounded-none border border-border bg-card">
          <DialogHeader className="font-mono">
            <DialogTitle className="uppercase text-sm font-bold tracking-wider">
              [03_RENAME_CATEGORY]
            </DialogTitle>
            <DialogDescription className="text-[11px] uppercase text-muted-foreground">
              Rename the category &quot;{editingCategory}&quot; across all items.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRenameCategorySubmit} className="flex flex-col gap-4 font-mono text-xs">
            <div>
              <label className="block text-[10px] text-muted-foreground uppercase mb-1">Category Name</label>
              <Input
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="New category name"
                required
                className="font-mono text-xs rounded-none bg-background border-border text-foreground focus-visible:ring-foreground focus-visible:ring-1"
              />
            </div>

            <DialogFooter className="flex justify-end gap-2 border-t pt-4 border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditCategoryDialogOpen(false)}
                className="rounded-none font-mono text-xs uppercase"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase"
              >
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item Create/Edit Dialog */}
      <WishlistFormDialog
        item={editingItem}
        open={isItemDialogOpen}
        onOpenChange={setIsItemDialogOpen}
      />
    </div>
  )
}
