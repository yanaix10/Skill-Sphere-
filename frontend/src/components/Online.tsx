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
    <div className="p-[20px] px-[30px] bg-[#313338] h-full overflow-y-auto">
      <div className="text-[12px] font-bold text-[#949ba4] mb-2.5 uppercase">ONLINE — {onlineFriends.length}</div>
      
      {onlineFriends.length > 0 ? (
        onlineFriends.map((friend) => (
          <div key={friend.id} className="flex justify-between items-center py-[12px] px-[16px] cursor-pointer border-b border-[#3f4147] transition-colors duration-200 hover:bg-[#3f4147] hover:rounded-[8px]" onClick={() => onSelect(friend)}>
            <div className="flex items-center gap-[15px]">
              <div className="relative inline-block">
                <div className="w-[38px] h-[38px] rounded-full bg-[#e67e22] text-white flex items-center justify-center font-bold shrink-0">{friend.name ? friend.name.charAt(0) : "?"}</div>
                <div className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-[#23a559] rounded-full border-2 border-[#313338]"></div>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="font-bold text-[#f2f3f5] text-[1rem] block">{friend.name}</span>
                <span className="text-[13px] text-[#b5bac1] font-normal block">Online</span>
              </div>
            </div>
            <div className="flex gap-[10px]">
              <button className="w-[40px] h-[40px] rounded-[8px] bg-[#1e1f22] border-none cursor-pointer flex items-center justify-center text-[1.2rem] text-white hover:opacity-80">💬</button>
              <button className="w-[40px] h-[40px] rounded-[8px] bg-[#1e1f22] border-none cursor-pointer flex items-center justify-center text-[1.2rem] text-white hover:opacity-80">⋮</button>
            </div>
          </div>
        ))
      ) : (
        <div className="flex flex-col justify-center items-center h-[200px] text-[#949ba4]">
          <p>No one is around to play right now.</p>
        </div>
      )}
    </div>
  );
};

export default OnlineList;
