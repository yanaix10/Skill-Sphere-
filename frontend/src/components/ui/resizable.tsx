import * as React from "react"
import { GripVertical } from "lucide-react"
import { Group, Panel, Separator } from "react-resizable-panels"
import { cn } from "@/lib/utils"

interface ResizablePanelGroupProps extends React.ComponentProps<typeof Group> {
  direction?: "horizontal" | "vertical"
}

const ResizablePanelGroup = ({
  className,
  direction = "horizontal",
  orientation,
  ...props
}: ResizablePanelGroupProps) => {
  return (
    <Group
      orientation={orientation || direction}
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    />
  );
};

interface ResizablePanelProps extends React.ComponentProps<typeof Panel> {
  defaultSize?: number | string
  minSize?: number | string
  maxSize?: number | string
}

function formatConstraint(size?: number | string): string | undefined {
  if (size === undefined) return undefined;
  if (typeof size === "number") {
    // If it's a percentage (<= 100), append % so react-resizable-panels 4.x doesn't treat it as pixels
    return `${size}%`;
  }
  return size;
}

const ResizablePanel = ({
  className,
  defaultSize,
  minSize,
  maxSize,
  ...props
}: ResizablePanelProps) => {
  return (
    <Panel
      className={className}
      defaultSize={formatConstraint(defaultSize)}
      minSize={formatConstraint(minSize)}
      maxSize={formatConstraint(maxSize)}
      {...props}
    />
  );
};

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & { withHandle?: boolean }) => {
  return (
    <Separator
      className={cn(
        "relative flex w-px items-center justify-center bg-border transition-colors hover:bg-primary/50 focus-visible:outline-none data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-border bg-secondary">
          <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
        </div>
      )}
    </Separator>
  );
};

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
