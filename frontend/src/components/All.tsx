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
    <div className="p-[20px] px-[30px] bg-[#313338] h-full overflow-y-auto">
      <div className="text-[12px] font-bold text-[#949ba4] mb-2.5 uppercase">ALL FRIENDS — {friends.length}</div>
      <div className="flex flex-col">
        {friends.map((friend) => (
          <div key={friend.id} className="flex justify-between items-center py-[12px] px-[16px] cursor-pointer border-b border-[#3f4147] transition-colors duration-200 hover:bg-[#3f4147] hover:rounded-[8px]" onClick={() => onSelect(friend)}>
            <div className="flex items-center gap-[15px]">
              <div className="w-[38px] h-[38px] rounded-full bg-[#e67e22] text-white flex items-center justify-center font-bold shrink-0">
                {friend.fullName ? friend.fullName.charAt(0).toUpperCase() : "?"}
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="font-bold text-[#f2f3f5] text-[1rem] block">{friend.fullName}</span>
                <span className="text-[13px] text-[#b5bac1] font-normal block">@{friend.username}</span>
              </div>
            </div>
            <div className="flex">
              <button
                className="w-[40px] h-[40px] rounded-[8px] bg-[#1e1f22] border-none cursor-pointer flex items-center justify-center text-[1.2rem] text-white hover:opacity-80"
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
        <div className="text-[13px] text-[#b5bac1] font-normal block p-[20px]">No friends found.</div>
      )}
    </div>
  );
};

export default AllList;
