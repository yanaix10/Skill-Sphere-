import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Search } from 'lucide-react';

interface SearchUser {
  id: string;
  username: string;
  name?: string;
}

interface AddFriendProps {
  onSearch: () => void;
  searchResults: SearchUser[];
  onAddFriend: (user: SearchUser) => void;
  setSearchName: (name: string) => void;
}

const AddFriend: React.FC<AddFriendProps> = ({
  onSearch,
  searchResults,
  onAddFriend,
  setSearchName,
}) => {
  return (
    <div className="bg-background p-6 md:p-8 h-full text-foreground overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Add Friend</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Search for people by username to add them to your friends list.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter username (e.g. soul_honest)"
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="pl-9 bg-card border-border text-sm"
            />
          </div>
          <Button onClick={onSearch} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Search
          </Button>
        </div>

        <div className="space-y-3 pt-2">
          {searchResults.map((user) => (
            <div
              key={user.id}
              className="flex justify-between items-center bg-card border border-border p-3.5 rounded-lg transition-colors hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-10 border border-border">
                  <AvatarFallback className="bg-secondary text-foreground font-semibold">
                    {(user.username || "?").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-semibold text-sm block">@{user.username}</span>
                  {user.name && <span className="text-xs text-muted-foreground">{user.name}</span>}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onAddFriend(user)}
                className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Send Request
              </Button>
            </div>
          ))}

          {searchResults.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Enter a username above to find friends on SkillSphere.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFriend;
