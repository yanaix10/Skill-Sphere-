import * as React from "react"
import { cn } from "@/lib/utils"

interface SidebarContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    return {
      open: true,
      setOpen: () => {},
      toggleSidebar: () => {},
    }
  }
  return context
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const toggleSidebar = () => setOpen((prev) => !prev)

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar }}>
      <div className="flex h-full w-full overflow-hidden bg-background">
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: string
    collapsible?: string
  }
>(({ className, children, ...props }, ref) => {
  const { open } = useSidebar()
  return (
    <aside
      ref={ref}
      className={cn(
        "flex flex-col border-r border-border bg-[#18181b] text-zinc-100 transition-all duration-200 shrink-0",
        open ? "w-60" : "w-14",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  )
})
Sidebar.displayName = "Sidebar"

export const SidebarContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 overflow-y-auto p-2", className)} {...props} />
)

export const SidebarGroup = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1 py-1", className)} {...props} />
)

export const SidebarGroupLabel = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "px-2 py-1 text-xs font-semibold text-zinc-400 tracking-wider uppercase",
      className
    )}
    {...props}
  />
)

export const SidebarGroupContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1", className)} {...props} />
)

export const SidebarMenu = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) => (
  <ul className={cn("flex flex-col gap-1 list-none p-0 m-0", className)} {...props} />
)

export const SidebarMenuItem = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) => (
  <li className={cn("relative", className)} {...props} />
)

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, asChild = false, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

export const SidebarFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto border-t border-border p-2", className)} {...props} />
)

export const SidebarInset = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1 flex overflow-hidden min-w-0", className)} {...props} />
)
