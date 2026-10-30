import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Smile, Heart, ThumbsUp, Code, Sparkles } from "lucide-react";

interface EmojiItem {
  char: string;
  name: string;
  keywords: string[];
}

const EMOJI_CATEGORIES: { id: string; name: string; icon: React.ReactNode; emojis: EmojiItem[] }[] = [
  {
    id: "smileys",
    name: "Smileys & Emotion",
    icon: <Smile className="w-4 h-4" />,
    emojis: [
      { char: "😀", name: "grinning", keywords: ["smile", "happy", "grin"] },
      { char: "😃", name: "smiley", keywords: ["happy", "joy"] },
      { char: "😄", name: "smile", keywords: ["laugh", "happy"] },
      { char: "😁", name: "beaming", keywords: ["grin", "eyes"] },
      { char: "😆", name: "laughing", keywords: ["satisfied", "haha"] },
      { char: "😅", name: "sweat smile", keywords: ["nervous", "relief"] },
      { char: "🤣", name: "rofl", keywords: ["rolling", "laughing", "lol"] },
      { char: "😂", name: "joy", keywords: ["cry", "tears", "lol", "lmao"] },
      { char: "🙂", name: "slight smile", keywords: ["smile", "calm"] },
      { char: "🙃", name: "upside down", keywords: ["silly", "sarcasm"] },
      { char: "😉", name: "wink", keywords: ["winking", "flirt"] },
      { char: "😊", name: "blush", keywords: ["proud", "pleased"] },
      { char: "😇", name: "innocent", keywords: ["angel", "halo"] },
      { char: "🥰", name: "love face", keywords: ["hearts", "adore"] },
      { char: "😍", name: "heart eyes", keywords: ["love", "crush"] },
      { char: "🤩", name: "star struck", keywords: ["excited", "wow"] },
      { char: "😘", name: "blow kiss", keywords: ["kiss", "love"] },
      { char: "😋", name: "yum", keywords: ["delicious", "tongue"] },
      { char: "😛", name: "tongue out", keywords: ["playful", "cheeky"] },
      { char: "😜", name: "winking tongue", keywords: ["crazy", "joke"] },
      { char: "🤪", name: "zany", keywords: ["wild", "party"] },
      { char: "😝", name: "squint tongue", keywords: ["mischief", "fun"] },
      { char: "🤑", name: "money mouth", keywords: ["rich", "cash"] },
      { char: "🤗", name: "hugs", keywords: ["embrace", "warm"] },
      { char: "🤭", name: "giggle", keywords: ["oops", "hand over mouth"] },
      { char: "🤫", name: "shh", keywords: ["quiet", "secret"] },
      { char: "🤔", name: "thinking", keywords: ["hmm", "curious", "ponder"] },
      { char: "🫡", name: "salute", keywords: ["respect", "yes sir"] },
      { char: "🤐", name: "zipper", keywords: ["sealed", "silent"] },
      { char: "🤨", name: "raised eyebrow", keywords: ["suspicious", "doubt"] },
      { char: "😐", name: "neutral", keywords: ["meh", "flat"] },
      { char: "😑", name: "expressionless", keywords: ["blank", "done"] },
      { char: "😶", name: "no mouth", keywords: ["speechless", "quiet"] },
      { char: "😏", name: "smirk", keywords: ["smug", "flirty"] },
      { char: "😒", name: "unamused", keywords: ["bored", "annoyed"] },
      { char: "🙄", name: "eye roll", keywords: ["disbelief", "sarcastic"] },
      { char: "😬", name: "grimace", keywords: ["awkward", "oops"] },
      { char: "🤥", name: "lying", keywords: ["pinocchio", "fake"] },
      { char: "😌", name: "relieved", keywords: ["peaceful", "calm"] },
      { char: "😔", name: "pensive", keywords: ["sad", "down"] },
      { char: "😪", name: "sleepy", keywords: ["tired", "rest"] },
      { char: "🤤", name: "drool", keywords: ["craving", "sleep"] },
      { char: "😴", name: "sleeping", keywords: ["zzz", "tired"] },
      { char: "😷", name: "mask", keywords: ["sick", "health"] },
      { char: "🤒", name: "fever", keywords: ["ill", "thermometer"] },
      { char: "🤕", name: "bandage", keywords: ["hurt", "injured"] },
      { char: "🤢", name: "nauseated", keywords: ["gross", "disgust"] },
      { char: "🤮", name: "vomit", keywords: ["puke", "sick"] },
      { char: "🤧", name: "sneeze", keywords: ["cold", "allergy"] },
      { char: "🥵", name: "hot", keywords: ["sweat", "summer"] },
      { char: "🥶", name: "cold", keywords: ["freezing", "ice"] },
      { char: "🥴", name: "woozy", keywords: ["dizzy", "tipsy"] },
      { char: "😵", name: "dizzy", keywords: ["knocked out", "star"] },
      { char: "🤯", name: "mind blown", keywords: ["shock", "explosion", "wow"] },
      { char: "🤠", name: "cowboy", keywords: ["hat", "yeehaw"] },
      { char: "🥳", name: "party", keywords: ["celebrate", "birthday"] },
      { char: "🥸", name: "disguise", keywords: ["incognito", "glasses"] },
      { char: "😎", name: "cool", keywords: ["sunglasses", "swag"] },
      { char: "🤓", name: "nerd", keywords: ["geek", "smart", "glasses"] },
      { char: "🧐", name: "monocle", keywords: ["investigate", "curious"] },
      { char: "😕", name: "confused", keywords: ["uncertain", "lost"] },
      { char: "😟", name: "worried", keywords: ["anxious", "nervous"] },
      { char: "🙁", name: "frown", keywords: ["sad", "disappointed"] },
      { char: "😮", name: "surprised", keywords: ["open mouth", "gasp", "wow"] },
      { char: "😯", name: "astonished", keywords: ["shocked", "speechless"] },
      { char: "😲", name: "gasp", keywords: ["stunned", "disbelief"] },
      { char: "😳", name: "flushed", keywords: ["blushing", "shock"] },
      { char: "🥺", name: "pleading", keywords: ["begging", "puppy eyes", "please"] },
      { char: "😦", name: "frowning open", keywords: ["afraid", "yikes"] },
      { char: "😨", name: "fearful", keywords: ["scared", "horror"] },
      { char: "😰", name: "anxious sweat", keywords: ["panic", "pressure"] },
      { char: "😥", name: "sad relief", keywords: ["sigh", "close call"] },
      { char: "😢", name: "crying", keywords: ["tear", "sad"] },
      { char: "😭", name: "loudly crying", keywords: ["sob", "weep", "tears"] },
      { char: "😱", name: "screaming", keywords: ["panic", "munch"] },
      { char: "😖", name: "confounded", keywords: ["frustrated", "stress"] },
      { char: "😣", name: "persevering", keywords: ["struggling", "effort"] },
      { char: "😞", name: "disappointed", keywords: ["defeated", "regret"] },
      { char: "😓", name: "downcast sweat", keywords: ["bummed", "exhausted"] },
      { char: "😩", name: "weary", keywords: ["tired", "ugh"] },
      { char: "😫", name: "tired face", keywords: ["done", "fed up"] },
      { char: "🥱", name: "yawning", keywords: ["boring", "sleepy"] },
      { char: "😤", name: "steam nose", keywords: ["triumph", "determined"] },
      { char: "😡", name: "rage", keywords: ["angry", "mad", "red"] },
      { char: "😠", name: "angry", keywords: ["furious", "pissed"] },
      { char: "🤬", name: "cursing", keywords: ["censored", "swear"] },
      { char: "💀", name: "skull", keywords: ["dead", "skeleton", "dying"] },
      { char: "☠️", name: "crossbones", keywords: ["danger", "pirate"] },
      { char: "💩", name: "poop", keywords: ["poo", "funny"] },
      { char: "🤡", name: "clown", keywords: ["circus", "fool"] },
      { char: "👻", name: "ghost", keywords: ["spooky", "boo"] },
      { char: "👽", name: "alien", keywords: ["ufo", "space"] },
      { char: "🤖", name: "robot", keywords: ["bot", "ai"] },
    ],
  },
  {
    id: "hands",
    name: "Hands & Gestures",
    icon: <ThumbsUp className="w-4 h-4" />,
    emojis: [
      { char: "👍", name: "thumbs up", keywords: ["like", "good", "yes", "approve"] },
      { char: "👎", name: "thumbs down", keywords: ["dislike", "no", "bad"] },
      { char: "👌", name: "ok hand", keywords: ["perfect", "fine"] },
      { char: "🤌", name: "pinched fingers", keywords: ["chef kiss", "italian"] },
      { char: "🤏", name: "pinching", keywords: ["small", "tiny", "little bit"] },
      { char: "✌️", name: "peace", keywords: ["victory", "two"] },
      { char: "🤞", name: "crossed fingers", keywords: ["luck", "hope"] },
      { char: "🫰", name: "hand heart", keywords: ["love", "kpop"] },
      { char: "🤟", name: "love you gesture", keywords: ["rock", "ily"] },
      { char: "🤘", name: "rock on", keywords: ["metal", "horns"] },
      { char: "🤙", name: "call me", keywords: ["shaka", "hang loose"] },
      { char: "👈", name: "point left", keywords: ["left", "look"] },
      { char: "👉", name: "point right", keywords: ["right", "look"] },
      { char: "👆", name: "point up", keywords: ["above", "this"] },
      { char: "👇", name: "point down", keywords: ["below", "read"] },
      { char: "☝️", name: "index up", keywords: ["one", "attention"] },
      { char: "✋", name: "raised hand", keywords: ["stop", "high five"] },
      { char: "🤚", name: "backhand", keywords: ["stop", "wave"] },
      { char: "🖐️", name: "fingers splayed", keywords: ["five", "open"] },
      { char: "🖖", name: "vulcan", keywords: ["spock", "prosper"] },
      { char: "👋", name: "wave", keywords: ["hello", "bye", "hi"] },
      { char: "🤝", name: "handshake", keywords: ["deal", "agreement", "partner"] },
      { char: "🙏", name: "folded hands", keywords: ["please", "thank you", "praying", "blessed"] },
      { char: "👏", name: "clapping", keywords: ["applause", "bravo", "good job"] },
      { char: "🙌", name: "raising hands", keywords: ["celebrate", "praise", "hurray"] },
      { char: "👐", name: "open hands", keywords: ["warmth", "hug"] },
      { char: "🤲", name: "palms up", keywords: ["prayer", "duo"] },
      { char: "💪", name: "flex", keywords: ["strong", "bicep", "gym", "power"] },
      { char: "👊", name: "fist", keywords: ["punch", "bump"] },
      { char: "✊", name: "raised fist", keywords: ["solidarity", "power"] },
      { char: "🤛", name: "fist left", keywords: ["fist bump"] },
      { char: "🤜", name: "fist right", keywords: ["fist bump"] },
    ],
  },
  {
    id: "hearts",
    name: "Hearts & Sparkles",
    icon: <Heart className="w-4 h-4" />,
    emojis: [
      { char: "❤️", name: "red heart", keywords: ["love", "heart", "like"] },
      { char: "🧡", name: "orange heart", keywords: ["friendship"] },
      { char: "💛", name: "yellow heart", keywords: ["kindness"] },
      { char: "💚", name: "green heart", keywords: ["nature", "growth"] },
      { char: "💙", name: "blue heart", keywords: ["loyalty", "trust"] },
      { char: "💜", name: "purple heart", keywords: ["compassion"] },
      { char: "🖤", name: "black heart", keywords: ["dark", "goth"] },
      { char: "🤍", name: "white heart", keywords: ["pure", "peace"] },
      { char: "🤎", name: "brown heart", keywords: ["earth"] },
      { char: "💔", name: "broken heart", keywords: ["heartbreak", "sad"] },
      { char: "❤️‍🔥", name: "heart on fire", keywords: ["passion", "flame"] },
      { char: "❤️‍🩹", name: "mending heart", keywords: ["healing", "recovery"] },
      { char: "❣️", name: "heart exclamation", keywords: ["love", "note"] },
      { char: "💕", name: "two hearts", keywords: ["love", "cute"] },
      { char: "💞", name: "revolving hearts", keywords: ["romance"] },
      { char: "💓", name: "beating heart", keywords: ["flutter", "alive"] },
      { char: "💗", name: "growing heart", keywords: ["warmth", "affection"] },
      { char: "💖", name: "sparkling heart", keywords: ["sparkle", "cute", "magic"] },
      { char: "💘", name: "cupid", keywords: ["arrow", "crush"] },
      { char: "💝", name: "ribbon heart", keywords: ["gift", "present"] },
      { char: "🔥", name: "fire", keywords: ["hot", "lit", "flame", "awesome"] },
      { char: "✨", name: "sparkles", keywords: ["magic", "clean", "star", "glow"] },
      { char: "🌟", name: "glowing star", keywords: ["bright", "superstar"] },
      { char: "⭐", name: "star", keywords: ["favorite", "gold"] },
      { char: "⚡", name: "lightning", keywords: ["bolt", "electric", "fast"] },
      { char: "💥", name: "boom", keywords: ["collision", "explode"] },
      { char: "💯", name: "hundred", keywords: ["perfect", "score", "real"] },
      { char: "🎉", name: "party popper", keywords: ["celebrate", "tada", "congrats"] },
      { char: "🎊", name: "confetti", keywords: ["festival", "party"] },
    ],
  },
  {
    id: "tech",
    name: "Coding & Activities",
    icon: <Code className="w-4 h-4" />,
    emojis: [
      { char: "💻", name: "laptop", keywords: ["computer", "code", "programming", "work"] },
      { char: "🖥️", name: "desktop", keywords: ["pc", "screen", "monitor"] },
      { char: "⌨️", name: "keyboard", keywords: ["typing", "coding"] },
      { char: "🖱️", name: "mouse", keywords: ["click", "hardware"] },
      { char: "🕹️", name: "joystick", keywords: ["gaming", "arcade"] },
      { char: "🎮", name: "controller", keywords: ["video game", "play"] },
      { char: "🚀", name: "rocket", keywords: ["launch", "fast", "ship", "space"] },
      { char: "🛰️", name: "satellite", keywords: ["orbit", "tech"] },
      { char: "🛸", name: "ufo", keywords: ["alien", "space"] },
      { char: "🏆", name: "trophy", keywords: ["winner", "first", "champion"] },
      { char: "🥇", name: "gold medal", keywords: ["first place", "winner"] },
      { char: "🥈", name: "silver medal", keywords: ["second place"] },
      { char: "🥉", name: "bronze medal", keywords: ["third place"] },
      { char: "🎯", name: "target", keywords: ["bullseye", "goal", "accuracy"] },
      { char: "🎲", name: "dice", keywords: ["game", "luck"] },
      { char: "🧩", name: "puzzle", keywords: ["logic", "solution", "dsa"] },
      { char: "💡", name: "lightbulb", keywords: ["idea", "innovation", "bright"] },
      { char: "☕", name: "coffee", keywords: ["caffeine", "drink", "morning"] },
      { char: "🍵", name: "tea", keywords: ["green tea", "relax"] },
      { char: "🍕", name: "pizza", keywords: ["food", "cheese", "slice"] },
      { char: "🍔", name: "burger", keywords: ["fast food", "dinner"] },
      { char: "🍟", name: "fries", keywords: ["french fries", "snack"] },
      { char: "🌮", name: "taco", keywords: ["mexican", "food"] },
      { char: "🍩", name: "donut", keywords: ["sweet", "doughnut"] },
      { char: "🍺", name: "beer", keywords: ["cheers", "drink"] },
      { char: "🍻", name: "clinking beers", keywords: ["celebrate", "party"] },
    ],
  },
];

export interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>("smileys");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredEmojis = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      const activeCat = EMOJI_CATEGORIES.find((c) => c.id === activeTab);
      return activeCat ? activeCat.emojis : [];
    }
    // Global search across all categories
    const results: EmojiItem[] = [];
    for (const cat of EMOJI_CATEGORIES) {
      for (const item of cat.emojis) {
        if (
          item.name.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        ) {
          if (!results.some((r) => r.char === item.char)) {
            results.push(item);
          }
        }
      }
    }
    return results;
  }, [activeTab, searchQuery]);

  return (
    <div className="w-[320px] bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl p-2.5 flex flex-col gap-2 z-50 text-foreground select-none">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 pl-8 text-xs bg-secondary/50 border-border rounded-lg"
          autoFocus
        />
      </div>

      {/* Categories Bar */}
      {!searchQuery && (
        <div className="flex items-center gap-1 border-b border-border/60 pb-1.5 px-0.5">
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                activeTab === cat.id
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emojis Grid */}
      <div className="h-52 overflow-y-auto pr-1 grid grid-cols-7 gap-1.5 auto-rows-max scrollbar-thin">
        {filteredEmojis.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelect(emoji.char);
              if (onClose) onClose();
            }}
            title={emoji.name}
            className="h-9 w-9 text-xl flex items-center justify-center rounded-lg hover:bg-secondary hover:scale-120 active:scale-95 transition-transform duration-150 cursor-pointer"
          >
            {emoji.char}
          </button>
        ))}
        {filteredEmojis.length === 0 && (
          <div className="col-span-7 py-8 text-center text-xs text-muted-foreground">
            No emojis found for "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};

export default EmojiPicker;
