import React from 'react';

interface OnlineFriend {
  id: string;
  name: string;
  status: string;
  [key: string]: any;
}

interface OnlineListProps {
  friends?: OnlineFriend[];
  onSelect: (friend: OnlineFriend) => void;
}

const OnlineList: React.FC<OnlineListProps> = ({ friends = [], onSelect }) => {
  const safeFriends = friends || [];
  const onlineFriends = safeFriends.filter(f => f.status === 'online');

  return (
    <div className="p-6 bg-background text-foreground h-full overflow-y-auto">
      <div className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
        Online — {onlineFriends.length}
      </div>
      
      {onlineFriends.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {onlineFriends.map((friend) => (
            <div
              key={friend.id}
              className="flex justify-between items-center py-2.5 px-3.5 cursor-pointer rounded-lg border border-border bg-card transition-colors hover:bg-secondary/60"
              onClick={() => onSelect(friend)}
            >
              <div className="flex items-center gap-3">
                <div className="relative inline-block">
                  <div className="size-9 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm shrink-0">
                    {friend.name ? friend.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full border-2 border-background"></div>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground text-sm leading-tight">{friend.name}</span>
                  <span className="text-xs text-emerald-500 font-medium">Online</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="size-8 rounded-lg bg-secondary text-secondary-foreground border border-border cursor-pointer flex items-center justify-center text-xs hover:bg-secondary/80">💬</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center h-48 text-muted-foreground text-xs text-center p-6">
          <p>No one is online right now.</p>
        </div>
      )}
    </div>
  );
};

export default OnlineList;
