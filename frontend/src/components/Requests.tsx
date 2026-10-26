import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  writeBatch, 
  serverTimestamp 
} from 'firebase/firestore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface FriendRequest {
  id: string;
  username?: string;
  [key: string]: any;
}

const RequestsList: React.FC = () => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(
      collection(db, 'users', currentUser.uid, 'friends'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incomingRequests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FriendRequest[];
      setRequests(incomingRequests);
    });

    return () => unsubscribe();
  }, []);

  const handleAccept = async (requestingUser: FriendRequest) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const batch = writeBatch(db);

    const myRef = doc(db, 'users', currentUser.uid, 'friends', requestingUser.id);
    const theirRef = doc(db, 'users', requestingUser.id, 'friends', currentUser.uid);

    batch.update(myRef, {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });

    batch.update(theirRef, {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleIgnore = async (requestingUserId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const batch = writeBatch(db);
    const myRef = doc(db, 'users', currentUser.uid, 'friends', requestingUserId);
    const theirRef = doc(db, 'users', requestingUserId, 'friends', currentUser.uid);

    batch.delete(myRef);
    batch.delete(theirRef);

    try {
      await batch.commit();
    } catch (error) {
      console.error('Error ignoring friend request:', error);
    }
  };

  return (
    <div className="p-6 md:p-8 bg-background h-full overflow-y-auto text-foreground">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Incoming Friend Requests — {requests.length}
        </div>
        {requests.length > 0 ? (
          requests.map((user) => (
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
                  <span className="text-xs text-muted-foreground">Sent you a friend request</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(user)}
                  className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleIgnore(user.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No incoming friend requests.
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestsList;
