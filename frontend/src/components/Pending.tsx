import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface UserRequest {
  id: string;
  username: string;
  [key: string]: any;
}

const PendingList: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<UserRequest[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, 'users', currentUser.uid, 'friends'),
      where('status', '==', 'requested')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as UserRequest));
      setPendingRequests(list);
    });

    return () => unsubscribe();
  }, []);

  const cancelRequest = async (targetUserId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'friends', targetUserId));
      await deleteDoc(doc(db, 'users', targetUserId, 'friends', currentUser.uid));
    } catch (error) {
      console.error('Error canceling request:', error);
    }
  };

  return (
    <div className="p-6 md:p-8 bg-background h-full overflow-y-auto text-foreground">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Outgoing Requests — {pendingRequests.length}
        </div>
        {pendingRequests.length > 0 ? (
          pendingRequests.map((user) => (
            <div
              key={user.id}
              className="flex justify-between items-center py-3 px-4 bg-card border border-border rounded-lg transition-colors hover:border-border/80"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-10 border border-border">
                  <AvatarFallback className="bg-secondary text-foreground font-semibold">
                    {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-semibold text-sm block">@{user.username}</span>
                  <span className="text-xs text-muted-foreground">Outgoing friend request</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => cancelRequest(user.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Cancel Request"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No pending outgoing requests.
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingList;
