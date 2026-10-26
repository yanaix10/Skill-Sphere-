"use client"

// ** Imports: React & Hooks **
import React, { useState } from "react"

// ** UI Components **
import {
  SidebarInset,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/blocks/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CardDescription, CardTitle } from "@/components/ui/card"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

// ** Dropdown Menu Components **
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ** Icons **
import {
  Brush,
  Camera,
  ChartBarIncreasing,
  ChevronUp,
  CircleFadingPlus,
  CircleOff,
  CircleUserRound,
  File,
  Image,
  ListFilter,
  Menu,
  MessageCircle,
  MessageSquareDashed,
  MessageSquareDot,
  Mic,
  Paperclip,
  Phone,
  Search,
  Send,
  Settings,
  Smile,
  SquarePen,
  Star,
  User,
  User2,
  UserRound,
  Users,
  Video,
} from "lucide-react"

// ** Contact List **
const contactList = [
  {
    name: "Manoj Rayi",
    message: "Your Last Message Here",
    image: "https://cdn.21st.dev/assets/mirror/60/60a78914033c8e6b417d2f6ce5cf81dcc37c9247e03432bbf81c63e1f5ecfbc3.jpg",
  },
  {
    name: "Anjali Kumar",
    message: "Hello, how are you?",
    image: "https://cdn.21st.dev/assets/mirror/e7/e7a0b30cb92ca533b2f8dbf57649e4b60129a9e84f3fc36d45b09e2dfcaec61d.jpg",
  },
  {
    name: "Ravi Teja",
    message: "Looking forward to the meeting.",
    image: "https://cdn.21st.dev/assets/mirror/4c/4cff4f892ece6dca0865313df96f11ac30e11b6dcbf3b9a86bad86a3049aa6e1.jpg",
  },
  {
    name: "Sneha Reddy",
    message: "Can you send the report?",
    image: "https://cdn.21st.dev/assets/mirror/55/55d0cf713811843ffbd3412ee403668a82597bb83aabbc684a87f66c1fc962e4.jpg",
  },
  {
    name: "Arjun Das",
    message: "Thank you for your help!",
    image: "https://cdn.21st.dev/assets/mirror/32/32afb68c9233445d08f7c4af3e781f648c6eeeb7dadeb5bdd341a003684d1c93.jpg",
  },
  {
    name: "Priya Sharma",
    message: "Let's catch up soon.",
    image: "https://cdn.21st.dev/assets/mirror/7f/7f2f1b6a4c09f5092437fe960232360d1e2dcf7a198c8580f3c5478c7b2d9386.jpg",
  },
  {
    name: "Vikram Singh",
    message: "I will call you later.",
    image: "https://cdn.21st.dev/assets/mirror/f2/f25b1b7a6a351c0f748d81bf4fcaf8c5a2f8ed036563c2693d4c1ca3718d9d5d.jpg",
  },
  {
    name: "Kavya Rao",
    message: "Did you receive my email?",
    image: "https://cdn.21st.dev/assets/mirror/41/417105f5784df0a25c3486becfe5c967d448e3c98b3c0231ef4ea0c59d27cb4b.jpg",
  },
  {
    name: "Rahul Verma",
    message: "Meeting rescheduled to tomorrow.",
    image: "https://cdn.21st.dev/assets/mirror/62/6252a3b6790cbb48919cb8ea756a4e1ce829f3271a141731226871b3c3df9d6d.jpg",
  },
  {
    name: "Deepika Nair",
    message: "Happy birthday! Have a great day!",
    image: "https://cdn.21st.dev/assets/mirror/54/54ebea0e1cad66565de28318ff2f512398bf5732f6f3f3fecea8ad4338b78778.jpg",
  },
  {
    name: "Rohit Malhotra",
    message: "What's the update?",
    image: "https://cdn.21st.dev/assets/mirror/21/21d6722e3baa38cb075afdc599a60c8861440a6dea431e7a8ff43f86d05190b9.jpg",
  },
  {
    name: "Neha Gupta",
    message: "Hope you're doing well!",
    image: "https://cdn.21st.dev/assets/mirror/20/20bb8458e0bb0345aae5ab6a975650d1210fdfc5721729b456f7342fc59b3113.jpg",
  },
  {
    name: "Amit Yadav",
    message: "Let's finalize the project.",
    image: "https://cdn.21st.dev/assets/mirror/56/56eb13218bfcbdfa4f6f950990d4666d616ad1f9e17777c976ccc79c781b68c6.jpg",
  },
  {
    name: "Simran Kaur",
    message: "Good morning!",
    image: "https://cdn.21st.dev/assets/mirror/4c/4c5eaf184e978fcf67bed792f0fa88543b664347c98727aa25da4c16e32eb367.jpg",
  },
  {
    name: "Varun Chopra",
    message: "I'll send the documents soon.",
    image: "https://cdn.21st.dev/assets/mirror/e8/e86e44eaa9cb076c9d359973ce68af0e0cd85bb5dac2e72b259582941a57621b.jpg",
  },
  {
    name: "Meera Joshi",
    message: "How was your weekend?",
    image: "https://cdn.21st.dev/assets/mirror/cc/cc6b757fbf1174ae601b39aa711d6dfcda1b236001a2f3a67c4293d73c9fd714.jpg",
  },
  {
    name: "Karthik Reddy",
    message: "Please confirm the time.",
    image: "https://cdn.21st.dev/assets/mirror/e8/e86e44eaa9cb076c9d359973ce68af0e0cd85bb5dac2e72b259582941a57621b.jpg",
  },
  {
    name: "Pooja Sharma",
    message: "See you at the event!",
    image: "https://cdn.21st.dev/assets/mirror/1c/1c09f1ab9440e4f0922ad6c7494fb9efa1ae446ac5d39c4fb5843ed3fbc5c952.jpg",
  },
  {
    name: "Sandeep Kumar",
    message: "Just checking in.",
    image: "https://cdn.21st.dev/assets/mirror/c4/c493b0a6d9a42ed0a102bcd31360d00491e23ac5cb4f7cbf8ae9c61f577ccccc.jpg",
  },
  {
    name: "Lavanya Patel",
    message: "Don't forget the meeting.",
    image: "https://cdn.21st.dev/assets/mirror/56/56cfb2a08032e82843ccac91504bbf42ababde4aea91bbacd9b683912cd8b21a.jpg",
  },
]

// ** Sidebar Menu Items **
const menuItems = [
  { title: "Messages", url: "#", icon: MessageCircle },
  { title: "Phone", url: "#", icon: Phone },
  { title: "Status", url: "#", icon: CircleFadingPlus },
]

// ** Home Component **
export const Home = () => {
  const { toggleSidebar } = useSidebar()
  const [currentChat, setCurrentChat] = useState(contactList[0])

  return (
    <>
      {/* Sidebar */}
      <Sidebar variant="floating" collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigate</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={toggleSidebar}>
                    <Menu className="w-4 h-4" />
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings className="w-4 h-4" /> Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 className="w-4 h-4" /> Manoj Rayi
                    <ChevronUp className="ml-auto w-4 h-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[200px]"
                >
                  <DropdownMenuItem>
                    <a href="https://github.com/rayimanoj8/">Account</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Back Up</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <SidebarInset>
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Chat List */}
          <ResizablePanel defaultSize={30} minSize={20} className="flex-grow">
            <div className="flex flex-col h-full border-r border-zinc-800 bg-[#1e1f22]">
              <div className="h-14 px-4 py-3 flex items-center border-b border-zinc-800">
                <p className="font-semibold text-white text-sm m-0">Chats</p>
                <div className="flex justify-end w-full gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                        <SquarePen className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <User className="w-4 h-4 mr-2" /> New Contact
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Users className="w-4 h-4 mr-2" /> New Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                        <ListFilter className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Filter Chats By</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem>
                          <MessageSquareDot className="w-4 h-4 mr-2" /> Unread
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Star className="w-4 h-4 mr-2" /> Favorites
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CircleUserRound className="w-4 h-4 mr-2" /> Contacts
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CircleOff className="w-4 h-4 mr-2" /> Non Contacts
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem>
                          <Users className="w-4 h-4 mr-2" /> Groups
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquareDashed className="w-4 h-4 mr-2" /> Drafts
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative px-3 py-3 border-b border-zinc-800/60">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Search or start new chat"
                  className="pl-9 h-8 bg-zinc-900 border-zinc-800 text-xs text-zinc-200"
                />
              </div>

              {/* Contact List */}
              <ScrollArea className="flex-grow">
                {contactList.map((contact, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentChat(contact)}
                    className="px-3 w-full py-2.5 hover:bg-zinc-800/60 cursor-pointer text-left transition-colors border-b border-zinc-800/40"
                  >
                    <div className="flex flex-row items-center gap-3">
                      <Avatar className="size-10 shrink-0">
                        <AvatarImage src={contact.image} />
                        <AvatarFallback>{contact.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <CardTitle className="text-sm font-medium text-zinc-200 truncate">{contact.name}</CardTitle>
                        <CardDescription className="text-xs text-zinc-400 truncate">{contact.message}</CardDescription>
                      </div>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Chat Window */}
          <ResizablePanel defaultSize={70} minSize={40}>
            <div className="flex flex-col justify-between h-full bg-[#121214] text-zinc-200">
              {/* Chat Header */}
              <div className="h-14 border-b border-zinc-800 flex items-center px-4 justify-between bg-[#18181b]">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={currentChat?.image} />
                    <AvatarFallback>{currentChat?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-semibold text-white">{currentChat?.name}</CardTitle>
                    <CardDescription className="text-xs text-zinc-400">Contact Info</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Messages Placeholder */}
              <div className="flex-1 p-6 flex flex-col justify-end gap-3 overflow-y-auto">
                <div className="self-start max-w-sm px-4 py-2 rounded-2xl bg-zinc-800 text-zinc-100 text-sm">
                  {currentChat?.message}
                </div>
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-2 p-3 border-t border-zinc-800 bg-[#18181b]">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                  <Smile className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Image className="w-4 h-4 mr-2" /> Photos & Videos
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Camera className="w-4 h-4 mr-2" /> Camera
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <File className="w-4 h-4 mr-2" /> Document
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserRound className="w-4 h-4 mr-2" /> Contact
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ChartBarIncreasing className="w-4 h-4 mr-2" /> Poll
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Brush className="w-4 h-4 mr-2" /> Drawing
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Input
                  className="flex-grow bg-zinc-900 border-zinc-800 text-sm text-zinc-200"
                  placeholder="Type a message"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                  <Send className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </SidebarInset>
    </>
  )
}

export function Demo() {
  return (
    <SidebarProvider>
      <Home />
    </SidebarProvider>
  )
}

export default Home
