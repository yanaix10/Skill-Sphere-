import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  writeBatch,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SquarePen,
  ListFilter,
  Search,
  MessageCircle,
  Users,
  Clock,
  UserCheck,
  UserPlus,
} from "lucide-react";
import ChatBox from "../components/ChatBox";
import ProfileView from "../components/ProfileView";
import RequestsList from "../components/Requests";
import PendingList from "../components/Pending";
import AddFriend from "../components/AddFriend";

export interface Friend {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  status: string;
  updatedAt?: any;
}

const Friends: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [selectedUser, setSelectedUser] = useState<Friend | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [searchName, setSearchName] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [friendsList, setFriendsList] = useState<Friend[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (currentUser.uid === "test-user-123") {
      const devFriends: Friend[] = [
        { id: "friend-soul", username: "soul_honest", name: "Soul Honest", status: "accepted" },
        { id: "friend-kritika", username: "kritikax45", name: "Kritika Sharma", status: "accepted" },
      ];
      setFriendsList(devFriends);
      if (!selectedUser) {
        setSelectedUser(devFriends[0]);
      }
      return;
    }

    const q = query(
      collection(db, "users", currentUser.uid, "friends"),
      where("status", "==", "accepted")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const friends = await Promise.all(
        snapshot.docs.map(async (d) => {
          const friendData = d.data();
          let name = friendData.name || "";
          let avatarUrl = friendData.avatarUrl || "";
          let username = friendData.username || "";

          // Always fetch live profile document so updated photos and names are visible
          try {
            const uDoc = await getDoc(doc(db, "users", d.id));
            if (uDoc.exists()) {
              const uData = uDoc.data();
              if (uData.name) name = uData.name;
              if (uData.avatarUrl) avatarUrl = uData.avatarUrl;
              if (uData.username) username = uData.username;
            }
          } catch (e) {
            console.warn("Could not fetch friend user profile:", e);
          }

          return {
            id: d.id,
            ...friendData,
            username: username || friendData.username || "",
            name: name || username || friendData.username || "",
            avatarUrl,
            status: friendData.status || "",
          } as Friend;
        })
      );
      setFriendsList(friends);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = async () => {
    const term = searchName.trim();
    if (!term || !auth.currentUser) return;

    try {
      const q = query(collection(db, "users"), where("username", "==", term));
      const querySnapshot = await getDocs(q);
      const usersFound: any[] = [];

      querySnapshot.forEach((d) => {
        if (d.id !== auth.currentUser?.uid) {
          usersFound.push({ id: d.id, ...d.data() });
        }
      });

      setResults(usersFound);
      if (activeTab !== "add") setActiveTab("add");
    } catch (error) {
      console.error("Search Error:", error);
    }
  };

  const addFriend = async (targetUser: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
      const myUsername = currentUserDoc.exists()
        ? currentUserDoc.data().username
        : "Unknown User";

      const batch = writeBatch(db);
      const senderRef = doc(
        db,
        "users",
        currentUser.uid,
        "friends",
        targetUser.id
      );
      const receiverRef = doc(
        db,
        "users",
        targetUser.id,
        "friends",
        currentUser.uid
      );

      batch.set(senderRef, {
        username: targetUser.username,
        name: targetUser.name || targetUser.username,
        status: "requested",
        updatedAt: serverTimestamp(),
      });

      batch.set(receiverRef, {
        username: myUsername,
        name: currentUserDoc.exists() ? (currentUserDoc.data().name || myUsername) : myUsername,
        status: "pending",
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      alert(`Request sent to @${targetUser.username}`);
      setResults([]);
      setSearchName("");
      setActiveTab("pending");
    } catch (error) {
      console.error("Error establishing friend connection:", error);
      alert("Failed to send request.");
    }
  };

  const filteredFriends = friendsList.filter((f) =>
    (f.name && f.name.toLowerCase().includes(searchFilter.toLowerCase())) ||
    f.username.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="h-full w-full bg-background text-foreground overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel: Chats List from chattemplate.txt */}
        <ResizablePanel defaultSize="25%" minSize="20%" maxSize="35%">
          <div className="flex flex-col h-full border-r border-border bg-card/50">
            {/* Header */}
            <div className="h-14 px-4 py-3 flex items-center justify-between border-b border-border shrink-0">
              <p className="font-semibold text-foreground text-sm m-0">Chats</p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Add Friend"
                  onClick={() => setActiveTab("add")}
                >
                  <SquarePen className="w-4 h-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <ListFilter className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-popover border-border">
                    <DropdownMenuLabel className="text-xs">
                      Filter Conversations
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        className="text-xs cursor-pointer"
                        onClick={() => setActiveTab("chat")}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" /> All Chats
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs cursor-pointer"
                        onClick={() => setActiveTab("requests")}
                      >
                        <UserCheck className="w-4 h-4 mr-2" /> Friend Requests
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs cursor-pointer"
                        onClick={() => setActiveTab("pending")}
                      >
                        <Clock className="w-4 h-4 mr-2" /> Pending Outgoing
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs cursor-pointer"
                        onClick={() => setActiveTab("add")}
                      >
                        <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative px-3 py-2.5 border-b border-border/60 shrink-0">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search or start new chat"
                className="pl-9 h-8 bg-secondary/50 border-border text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            {/* Contact List */}
            <ScrollArea className="flex-1">
              <div className="p-1 space-y-0.5">
                {filteredFriends.map((friend) => {
                  const isSelected =
                    selectedUser?.id === friend.id && activeTab === "chat";
                  return (
                    <button
                      key={friend.id}
                      onClick={() => {
                        setSelectedUser(friend);
                        setActiveTab("chat");
                      }}
                      className={`px-3 w-full py-2.5 rounded-md cursor-pointer text-left transition-colors flex items-center gap-3 ${
                        isSelected
                          ? "bg-secondary text-foreground"
                          : "hover:bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      <Avatar className="size-10 shrink-0 border border-border">
                        {friend.avatarUrl && (
                          <AvatarImage src={friend.avatarUrl} alt={friend.name || friend.username} />
                        )}
                        <AvatarFallback className="bg-secondary text-foreground font-semibold text-sm">
                          {(friend.name || friend.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <CardTitle className="text-sm font-medium text-foreground truncate">
                          {friend.name || friend.username}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground truncate">
                          @{friend.username}
                        </CardDescription>
                      </div>
                    </button>
                  );
                })}

                {filteredFriends.length === 0 && (
                  <div className="text-center py-10 text-xs text-muted-foreground">
                    {searchFilter ? "No matching contacts." : "No friends yet."}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle className="bg-border hover:bg-primary/50 transition-colors" />

        {/* Center Panel: Chat Window or Views */}
        <ResizablePanel
          defaultSize={selectedUser && activeTab === "chat" ? "50%" : "75%"}
          minSize="30%"
        >
          {activeTab === "chat" ? (
            selectedUser ? (
              <ChatBox selectedUser={selectedUser} />
            ) : (
              <div className="flex-1 h-full flex flex-col items-center justify-center text-muted-foreground bg-background gap-3 p-6 text-center">
                <div className="size-14 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">
                    Select a conversation
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Choose a friend from the list or click the pen icon to connect
                    with people and start chatting.
                  </p>
                </div>
              </div>
            )
          ) : activeTab === "add" ? (
            <AddFriend
              onSearch={handleSearch}
              searchResults={results}
              onAddFriend={addFriend}
              setSearchName={setSearchName}
            />
          ) : activeTab === "pending" ? (
            <PendingList />
          ) : activeTab === "requests" ? (
            <RequestsList />
          ) : null}
        </ResizablePanel>

        {/* Right Panel: Discord-style Profile Card from hey.txt */}
        {selectedUser && activeTab === "chat" && (
          <>
            <ResizableHandle className="bg-border hover:bg-primary/50 transition-colors" />
            <ResizablePanel defaultSize="25%" minSize="20%" maxSize="35%">
              <ProfileView userId={selectedUser.id} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default Friends;
