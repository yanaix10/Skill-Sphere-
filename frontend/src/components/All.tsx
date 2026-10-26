import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

interface Friend {
  id: string;
  username: string;
  fullName: string;
  [key: string]: any;
}

interface AllListProps {
  onSelect: (friend: Friend) => void;
  setActiveTab: (tab: string) => void;
}

const AllList: React.FC<AllListProps> = ({ onSelect, setActiveTab }) => {
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, 'users', currentUser.uid, 'friends'),
      where('status', '==', 'accepted')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const friendData = await Promise.all(
        snapshot.docs.map(async (friendDoc) => {
          const friendId = friendDoc.id;
          const friendBaseData = friendDoc.data();
          
          try {
            const userSnap = await getDoc(doc(db, "users", friendId));
            const fullName = userSnap.exists() ? userSnap.data().name : friendBaseData.username;
            
            return {
              id: friendId,
              ...friendBaseData,
              fullName: fullName || friendBaseData.username
            } as Friend;
          } catch (error) {
            return { id: friendId, ...friendBaseData, fullName: friendBaseData.username } as Friend;
          }
        })
      );
      setFriends(friendData);
    });

    return () => unsubscribe();
  }, []);

  const handleMessageClick = (friend: Friend) => {
    onSelect(friend);
    setActiveTab('chat');
  };

  return (
    <div className="p-6 bg-background text-foreground h-full overflow-y-auto">
      <div className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
        All Friends — {friends.length}
      </div>
      <div className="flex flex-col gap-1.5">
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="flex justify-between items-center py-2.5 px-3.5 cursor-pointer rounded-lg border border-border bg-card transition-colors hover:bg-secondary/60"
            onClick={() => onSelect(friend)}
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm shrink-0">
                {friend.fullName ? friend.fullName.charAt(0).toUpperCase() : "?"}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm leading-tight">{friend.fullName}</span>
                <span className="text-xs text-muted-foreground">@{friend.username}</span>
              </div>
            </div>
            <div className="flex">
              <button
                className="size-8 rounded-lg bg-secondary text-secondary-foreground border border-border cursor-pointer flex items-center justify-center text-xs hover:bg-secondary/80 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMessageClick(friend);
                }}
                title="Message"
              >
                💬
              </button>
            </div>
          </div>
        ))}
      </div>
      {friends.length === 0 && (
        <div className="text-xs text-muted-foreground p-6 text-center">No friends found.</div>
      )}
    </div>
  );
};

export default AllList;
