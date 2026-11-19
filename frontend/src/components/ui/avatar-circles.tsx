import React from "react";
import { cn } from "@/lib/utils";

export interface AvatarCirclesProps {
  className?: string;
  numPeople?: number;
  avatarUrls: string[];
}

export const AvatarCircles: React.FC<AvatarCirclesProps> = ({
  numPeople,
  className,
  avatarUrls = [],
}) => {
  return (
    <div className={cn("z-10 flex -space-x-2.5 rtl:space-x-reverse items-center", className)}>
      {avatarUrls.map((url, index) => (
        <img
          key={index}
          className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-background object-cover bg-muted shrink-0"
          src={url}
          width={28}
          height={28}
          alt={`Likers avatar ${index + 1}`}
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      ))}
      {numPeople !== undefined && numPeople > 0 && (
        <span
          className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 border-background bg-secondary text-center text-[10px] font-bold text-foreground shadow-2xs shrink-0 select-none"
        >
          +{numPeople}
        </span>
      )}
    </div>
  );
};

export default AvatarCircles;

