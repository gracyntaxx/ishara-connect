import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar, Footer } from "../components";
import {
  Sparkles,
  BookOpen,
  Heart,
  Bookmark,
  Share2,
  Lightbulb,
  Cpu,
  Info,
  CheckCircle2,
  Users,
  Search,
  Tag,
  ThumbsUp,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/awareness")({
  component: AwarenessPage,
});

interface ArticleItem {
  id: string;
  category: "tips" | "facts" | "inventions" | "etiquette";
  categoryLabel: string;
  title: string;
  summary: string;
  readTime: string;
  icon: string;
  badgeColor: string;
  keyPoints: string[];
  initialLikes: number;
}

const AWARENESS_FEED: ArticleItem[] = [
  {
    id: "tip-speaking-guide",
    category: "tips",
    categoryLabel: "Communication Tips",
    title: "How to Talk With Deaf & Non-Verbal Individuals",
    summary:
      "Essential everyday guidance for speaking people when communicating with Deaf, mute, or hard-of-hearing peers.",
    readTime: "3 min read",
    icon: "💬",
    badgeColor: "bg-[#e8f0fe] text-[#1a73e8]",
    keyPoints: [
      "Maintain direct eye contact — facial expressions provide essential emotional and grammatical context.",
      "Speak at normal volume and cadence; shouting or exaggerating mouth movements distorts lip-reading.",
      "Get attention respectfully with a gentle shoulder tap or a light wave in their visual field.",
      "Keep pen/paper or smartphone notes handy for complex names or numbers.",
    ],
    initialLikes: 142,
  },
  {
    id: "fact-isl-history",
    category: "facts",
    categoryLabel: "Sign Language Facts",
    title: "Indian Sign Language (ISL): History & Cultural Richness",
    summary:
      "India is home to over 18 million deaf and hard-of-hearing individuals. Discover how ISL evolved with unique regional nuances.",
    readTime: "4 min read",
    icon: "🇮🇳",
    badgeColor: "bg-[#feefe3] text-[#b06000]",
    keyPoints: [
      "ISL is a complete, natural language with its own complex spatial grammar, not a word-for-word translation of spoken Hindi or English.",
      "ISL uses two-handed manual alphabets alongside vivid spatial reference planes.",
      "The Indian Sign Language Research and Training Centre (ISLRTC) now standardizes educational curricula across India.",
    ],
    initialLikes: 198,
  },
  {
    id: "tech-smart-glasses",
    category: "inventions",
    categoryLabel: "Assistive Tech & Inventions",
    title: "AI Smart Glasses with Real-Time Heads-Up Captions",
    summary:
      "Breakthrough augmented-reality spectacles project live voice-to-text transcriptions directly into the wearer's line of sight.",
    readTime: "3 min read",
    icon: "👓",
    badgeColor: "bg-[#ceead6] text-[#137333]",
    keyPoints: [
      "Micro-OLED waveguide lenses display crisp real-time speech subtitles under 100ms latency.",
      "Directional beamforming microphones isolate the speaker's voice in noisy environments.",
      "Allows deaf users to participate seamlessly in group meetings and dinner conversations.",
    ],
    initialLikes: 245,
  },
  {
    id: "etiquette-respectful-terms",
    category: "etiquette",
    categoryLabel: "Etiquette & Respect",
    title: "Respectful Terminology: Moving Beyond Archaic Words",
    summary:
      "Why terms like 'Deaf', 'Hard of Hearing', and 'Non-Verbal' are preferred over outdated labels like 'deaf-mute' or 'dumb'.",
    readTime: "2 min read",
    icon: "🤝",
    badgeColor: "bg-[#fce8e6] text-[#c5221f]",
    keyPoints: [
      "The term 'dumb' historically meant unable to speak, but carries derogatory connotations today.",
      "Preferred terms are 'Deaf' (with capital 'D' denoting cultural identity), 'Hard of Hearing', or 'Non-verbal person'.",
      "Deaf individuals possess rich expressive linguistic capability through sign languages.",
    ],
    initialLikes: 189,
  },
  {
    id: "tech-haptic-gloves",
    category: "inventions",
    categoryLabel: "Assistive Tech & Inventions",
    title: "Haptic Sensor Gloves: Translating Gestures into Sound",
    summary:
      "Wearable sensory gloves equipped with flex sensors and IMUs instantly convert hand signs into synthesized spoken audio.",
    readTime: "4 min read",
    icon: "🧤",
    badgeColor: "bg-[#ceead6] text-[#137333]",
    keyPoints: [
      "High-precision flex sensors capture knuckle bend angles and palm rotation in real-time.",
      "Onboard microcontrollers stream data via Bluetooth to a smartphone that vocalizes the phrase.",
      "Enables two-way conversations with people who do not know sign language.",
    ],
    initialLikes: 310,
  },
  {
    id: "fact-universal-myth",
    category: "facts",
    categoryLabel: "Sign Language Facts",
    title: "Myth Debunked: Sign Language is NOT Universal",
    summary:
      "There are over 300 distinct sign languages worldwide, each with indigenous vocabulary, slang, and cultural evolution.",
    readTime: "3 min read",
    icon: "🌍",
    badgeColor: "bg-[#feefe3] text-[#b06000]",
    keyPoints: [
      "American Sign Language (ASL), British Sign Language (BSL), and Indian Sign Language (ISL) are completely different languages.",
      "A deaf person from London and a deaf person from New York cannot automatically understand each other because BSL and ASL have different origins.",
      "International Sign (IS) is used at international conferences like the Deaflympics.",
    ],
    initialLikes: 167,
  },
  {
    id: "tip-interpreter-etiquette",
    category: "etiquette",
    categoryLabel: "Etiquette & Respect",
    title: "How to Conduct a Conversation When an Interpreter is Present",
    summary:
      "Avoid the most common communication mistake: always look at the person, never the interpreter.",
    readTime: "2 min read",
    icon: "👁️",
    badgeColor: "bg-[#fce8e6] text-[#c5221f]",
    keyPoints: [
      "Always speak directly to the Deaf individual ('What do you think?'), not to the interpreter ('Ask him what he thinks').",
      "Position yourself directly facing the Deaf person so you can observe their expressions naturally.",
      "The interpreter will speak in the first person ('I') as the voice of the signing individual.",
    ],
    initialLikes: 212,
  },
  {
    id: "tip-visual-home",
    category: "tips",
    categoryLabel: "Communication Tips",
    title: "Designing Accessible Living: Visual Alert Systems",
    summary:
      "Simple modifications that make homes and offices accessible: flashing doorbells, smart vibration bands, and strobe alarms.",
    readTime: "3 min read",
    icon: "💡",
    badgeColor: "bg-[#e8f0fe] text-[#1a73e8]",
    keyPoints: [
      "Replace audio doorbells with pulsed ambient LED lighting in living rooms and kitchens.",
      "Install vibrating alarm clocks placed under the pillow for reliable morning wake-ups.",
      "Ensure emergency smoke alarms feature high-intensity strobe beacons.",
    ],
    initialLikes: 176,
  },
];

function AwarenessPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [likes, setLikes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    AWARENESS_FEED.forEach((item) => {
      initial[item.id] = item.initialLikes;
    });
    return initial;
  });
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});

  const handleToggleLike = (id: string) => {
    const isCurrentlyLiked = userLiked[id];
    setUserLiked({ ...userLiked, [id]: !isCurrentlyLiked });
    setLikes({
      ...likes,
      [id]: isCurrentlyLiked ? likes[id] - 1 : likes[id] + 1,
    });
  };

  const filteredArticles = AWARENESS_FEED.filter((article) => {
    const matchesCategory = activeCategory === "all" || article.category === activeCategory;
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <Navbar />

      <main className="flex-1 py-10 px-4">
        <div className="mx-auto max-w-5xl">
          {/* Header Banner */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-xs font-semibold mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Inclusion & Accessibility Feed</span>
            </div>
            <h1 className="text-3xl font-normal text-[#202124] tracking-tight">
              Awareness & Community Hub
            </h1>
            <p className="text-sm text-[#5f6368] mt-1">
              Practical tips for speaking people, facts about sign language, modern assistive inventions, and empathetic etiquette.
            </p>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5f6368]" />
              <input
                type="text"
                placeholder="Search tips, inventions, or facts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#dadce0] rounded-xl text-xs sm:text-sm text-[#202124] placeholder:text-[#80868b] focus:outline-none focus:border-[#1a73e8]"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 bg-white border border-[#dadce0] p-1 rounded-xl">
              {[
                { id: "all", label: "All" },
                { id: "tips", label: "Tips" },
                { id: "facts", label: "Facts" },
                { id: "inventions", label: "Inventions" },
                { id: "etiquette", label: "Etiquette" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    activeCategory === cat.id
                      ? "bg-[#1a73e8] text-white shadow-sm"
                      : "text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feed Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                className="bg-white border border-[#dadce0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${article.badgeColor}`}>
                      {article.categoryLabel}
                    </span>
                    <span className="text-[11px] text-[#5f6368]">{article.readTime}</span>
                  </div>

                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl flex-shrink-0">{article.icon}</div>
                    <h2 className="text-base font-semibold text-[#202124] leading-snug">
                      {article.title}
                    </h2>
                  </div>

                  <p className="text-xs text-[#5f6368] leading-relaxed mb-4">
                    {article.summary}
                  </p>

                  <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e8eaed] space-y-2 mb-4">
                    <div className="text-xs font-semibold text-[#202124] flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-[#fbbc04]" />
                      <span>Key Takeaways:</span>
                    </div>
                    {article.keyPoints.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-[#3c4043]">
                        <CheckCircle2 className="w-3 h-3 text-[#34a853] flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#f1f3f4] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(article.id)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      userLiked[article.id]
                        ? "bg-[#fce8e6] text-[#c5221f]"
                        : "text-[#5f6368] hover:bg-[#f1f3f4]"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${userLiked[article.id] ? "fill-current" : ""}`} />
                    <span>{likes[article.id]}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Article link copied to clipboard!");
                      }}
                      className="p-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-lg transition-colors"
                      title="Share Article"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
