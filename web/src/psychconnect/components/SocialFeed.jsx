import { useState, useEffect } from "react";
import { GeminiService } from "../../services/ai";
import { MOCK_SUPPORT_GROUPS } from "../services/data";
import { 
  Heart, MessageCircle, Shield, Award, Sparkles, Send, EyeOff, Check, 
  AlertCircle, Search, CornerDownRight, ArrowUp, ArrowDown, Plus, X, 
  Flame, Clock, TrendingUp, ChevronLeft, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_STORIES = [
  {
    id: "story_sarah",
    authorName: "Dr. Sarah Jenkins",
    authorAvatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
    authorRole: "psychologist",
    slides: [
      { text: "🌟 Mindful Tip: Take 3 deep breaths, sensing the air filling your chest. Hold for 4s, release.", type: "tip" },
      { text: "🌱 'You do not have to control your thoughts. You just have to stop letting them control you.'", type: "quote" }
    ]
  },
  {
    id: "story_mei",
    authorName: "Dr. Mei Chen",
    authorAvatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200",
    authorRole: "psychologist",
    slides: [
      { text: "⚡ Focus hack: Break big tasks into 15-minute micro-sprints. Complete one, take a stretches break.", type: "tip" },
      { text: "🧩 Rejection Sensitivity: Notice the physical activation (tight chest). Take a step back before responding.", type: "tip" }
    ]
  },
  {
    id: "story_zenbot",
    authorName: "ZenBot",
    authorAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200",
    authorRole: "assistant",
    slides: [
      { text: "🌀 Box Breathing: Inhale 4s -> Hold 4s -> Exhale 4s -> Hold empty 4s. Repeat.", type: "breathing" }
    ]
  },
  {
    id: "story_user_1",
    authorName: "Alex Rivera",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    authorRole: "patient",
    slides: [
      { text: "🎉 Milestone: Logged somatic signals 3 days in a row! Noticing tension before it spirals.", type: "milestone" }
    ]
  }
];

export default function SocialFeed({ posts, currentUser, setPosts }) {
  // Post Creator State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  // Discussion filters
  const [selectedTag, setSelectedTag] = useState(null);
  
  // Sorting state (Reddit style)
  const [sortBy, setSortBy] = useState("Hot"); // Hot, New, Top

  // Stories States
  const [stories, setStories] = useState(DEFAULT_STORIES);
  const [activeStoryId, setActiveStoryId] = useState(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isNewStoryModalOpen, setIsNewStoryModalOpen] = useState(false);
  const [newStoryText, setNewStoryText] = useState("");

  // AI Coping Companion State
  const [selectedStruggle, setSelectedStruggle] = useState("Social Anxiety");
  const [customStruggle, setCustomStruggle] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Comments states
  const [activePostIdForComment, setActivePostIdForComment] = useState(null);
  const [commentTextState, setCommentTextState] = useState({});

  // Nested replies states
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");

  // Emoji Reaction Hover State
  const [hoveredPostId, setHoveredPostId] = useState(null);

  // Gather unique tags for filtering
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags || [])));

  // Automatic Stories slideshow timer
  useEffect(() => {
    if (activeStoryId === null) return;
    const currentStory = stories.find(s => s.id === activeStoryId);
    if (!currentStory) return;

    const timer = setTimeout(() => {
      if (activeSlideIdx < currentStory.slides.length - 1) {
        setActiveSlideIdx(prev => prev + 1);
      } else {
        // Go to next story or close
        const currentIdx = stories.findIndex(s => s.id === activeStoryId);
        if (currentIdx < stories.length - 1) {
          setActiveStoryId(stories[currentIdx + 1].id);
          setActiveSlideIdx(0);
        } else {
          setActiveStoryId(null);
          setActiveSlideIdx(0);
        }
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [activeStoryId, activeSlideIdx, stories]);

  // Handle post creation
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    const tagsArray = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const uniqueTagsSet = new Set([selectedCategory, ...tagsArray]);
    const finalTags = Array.from(uniqueTagsSet);

    const newPost = {
      id: "post_user_" + Date.now(),
      authorId: currentUser.id,
      authorName: isAnonymous ? "Anonymous Member" : currentUser.name,
      authorAvatar: isAnonymous
        ? "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=80&w=200"
        : currentUser.avatar,
      authorRole: currentUser.role,
      isAnonymous: isAnonymous,
      title: newTitle,
      content: newContent,
      timestamp: new Date().toISOString(),
      likes: 1, // Start with self-upvote
      upvotes: 1,
      downvotes: 0,
      upvotedBy: [currentUser.id],
      downvotedBy: [],
      reactions: { "👍": 0, "❤️": 0, "🧘": 0, "💡": 0, "😮": 0 },
      tags: finalTags,
      comments: [
        {
          id: "cmt_welcome_" + Date.now(),
          authorId: "system",
          authorName: "Clinical Assistant",
          authorAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200",
          authorRole: "psychologist",
          content: "Welcome! Feel free to ask questions. This community is moderated to maintain a supportive therapeutic space.",
          timestamp: new Date().toISOString()
        }
      ]
    };
    setPosts([newPost, ...posts]);
    setNewTitle("");
    setNewContent("");
    setTagsInput("");
    setSelectedCategory("General");
    setIsAnonymous(false);
  };

  // Add a story
  const handleCreateStory = () => {
    if (!newStoryText.trim()) return;
    const newStory = {
      id: "story_" + Date.now(),
      authorName: currentUser.name.split(",")[0],
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      slides: [
        { text: newStoryText.trim(), type: currentUser.role === "psychologist" ? "tip" : "milestone" }
      ]
    };
    setStories([newStory, ...stories]);
    setNewStoryText("");
    setIsNewStoryModalOpen(false);
  };

  // Handle Reply Submission (nested system)
  const handleAddReply = (postId, parentCommentId) => {
    if (!replyText.trim()) return;
    const newComment = {
      id: "cmt_reply_" + Date.now(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      content: replyText,
      timestamp: new Date().toISOString(),
      parentId: parentCommentId
    };
    setPosts(posts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), newComment]
        };
      }
      return post;
    }));
    setReplyText("");
    setActiveReplyCommentId(null);
  };

  // Reddit Upvote
  const handleUpvote = (postId) => {
    setPosts(posts.map((post) => {
      if (post.id === postId) {
        const upvotedBy = post.upvotedBy || [];
        const downvotedBy = post.downvotedBy || [];
        const alreadyUpvoted = upvotedBy.includes(currentUser.id);
        const alreadyDownvoted = downvotedBy.includes(currentUser.id);

        let nextUpvoted = [...upvotedBy];
        let nextDownvoted = [...downvotedBy];

        if (alreadyUpvoted) {
          nextUpvoted = nextUpvoted.filter(id => id !== currentUser.id);
        } else {
          nextUpvoted.push(currentUser.id);
          if (alreadyDownvoted) {
            nextDownvoted = nextDownvoted.filter(id => id !== currentUser.id);
          }
        }
        
        const netUpvotes = nextUpvoted.length;
        const netDownvotes = nextDownvoted.length;
        return {
          ...post,
          upvotedBy: nextUpvoted,
          downvotedBy: nextDownvoted,
          upvotes: netUpvotes,
          downvotes: netDownvotes,
          likes: netUpvotes - netDownvotes
        };
      }
      return post;
    }));
  };

  // Reddit Downvote
  const handleDownvote = (postId) => {
    setPosts(posts.map((post) => {
      if (post.id === postId) {
        const upvotedBy = post.upvotedBy || [];
        const downvotedBy = post.downvotedBy || [];
        const alreadyUpvoted = upvotedBy.includes(currentUser.id);
        const alreadyDownvoted = downvotedBy.includes(currentUser.id);

        let nextUpvoted = [...upvotedBy];
        let nextDownvoted = [...downvotedBy];

        if (alreadyDownvoted) {
          nextDownvoted = nextDownvoted.filter(id => id !== currentUser.id);
        } else {
          nextDownvoted.push(currentUser.id);
          if (alreadyUpvoted) {
            nextUpvoted = nextUpvoted.filter(id => id !== currentUser.id);
          }
        }

        const netUpvotes = nextUpvoted.length;
        const netDownvotes = nextDownvoted.length;
        return {
          ...post,
          upvotedBy: nextUpvoted,
          downvotedBy: nextDownvoted,
          upvotes: netUpvotes,
          downvotes: netDownvotes,
          likes: netUpvotes - netDownvotes
        };
      }
      return post;
    }));
  };

  // Facebook-style emoji reactions toggle
  const handleReact = (postId, emoji) => {
    setPosts(posts.map((post) => {
      if (post.id === postId) {
        const currentReactions = post.reactions || { "👍": 0, "❤️": 0, "🧘": 0, "💡": 0, "😮": 0 };
        const updatedReactions = { ...currentReactions };
        
        // Toggle simulation
        updatedReactions[emoji] = (updatedReactions[emoji] || 0) + 1;

        return {
          ...post,
          reactions: updatedReactions
        };
      }
      return post;
    }));
    setHoveredPostId(null);
  };

  // Handle Comment Submission
  const handleAddComment = (postId) => {
    const text = commentTextState[postId] || "";
    if (!text.trim()) return;
    const newComment = {
      id: "cmt_" + Date.now(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      content: text,
      timestamp: new Date().toISOString()
    };
    setPosts(posts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), newComment]
        };
      }
      return post;
    }));
    setCommentTextState({ ...commentTextState, [postId]: "" });
  };

  // Handle server-side Gemini call for coping advice
  const handleGenerateCopingGuide = async () => {
    setIsGenerating(true);
    setAiResponse("");
    const targetChallenge = customStruggle.trim() || selectedStruggle;
    const prompt = `Formulate a clinical, highly empathetic 4-step coping roadmap for a client struggling with: "${targetChallenge}".`;
    try {
      const text = await GeminiService.callGemini(prompt, "You are an empathetic, warm clinical psychologist. Give the client customized, evidence-based coping drills (derived from Cognitive Behavioral Therapy, Acceptance and Commitment Therapy, or mindfulness) to manage their scenario. Format with clear, soothing, actionable bullet points.");
      if (text) {
        setAiResponse(text);
      } else {
        setAiResponse("Apologies, I could not generate coping advice right now. Please test again in a moment.");
      }
    } catch (err) {
      console.error(err);
      setAiResponse("Failed to connect to the mental health service. Ensure API keys are active.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Reddit Hotness Score calculation
  const getHotnessScore = (post) => {
    const karma = (post.upvotes || post.likes || 0) - (post.downvotes || 0);
    const postTime = new Date(post.timestamp).getTime();
    const ageHours = (Date.now() - postTime) / 3600000;
    return karma / Math.pow(ageHours + 2, 1.2);
  };

  // Filter and Sort posts
  const processedPosts = posts
    .filter((post) => {
      // tag filter
      if (selectedTag && !post.tags?.includes(selectedTag)) {
        return false;
      }
      // search query filter
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase().trim();
        const titleMatch = post.title?.toLowerCase().includes(queryLower);
        const contentMatch = post.content?.toLowerCase().includes(queryLower);
        const authorMatch = post.authorName?.toLowerCase().includes(queryLower);
        const tagMatch = post.tags?.some((t) => t.toLowerCase().includes(queryLower));
        return titleMatch || contentMatch || authorMatch || tagMatch;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "New") {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === "Top") {
        const karmaA = (a.upvotes || a.likes || 0) - (a.downvotes || 0);
        const karmaB = (b.upvotes || b.likes || 0) - (b.downvotes || 0);
        return karmaB - karmaA;
      }
      return getHotnessScore(b) - getHotnessScore(a);
    });

  const currentStoryObj = stories.find(s => s.id === activeStoryId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 py-8" id="social-feed-container">
      
      {/* Left Sidebar */}
      <div className="lg:col-span-4 space-y-6" id="left-sidebar">
        {/* Moderated Support Groups */}
        <div className="bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg" id="support-groups-card">
          <h2 className="text-sm font-light tracking-wider text-slate-100 flex items-center mb-4 uppercase" style={{ fontFamily: "Georgia, serif" }}>
            <Shield className="w-4 h-4 text-indigo-400 mr-2" />
            Moderated Support Groups
          </h2>
          <div className="space-y-3">
            {MOCK_SUPPORT_GROUPS.map((group) => (
              <div key={group.id} id={`group-${group.id}`} className="p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl transition cursor-pointer border border-white/5">
                <div className="flex justify-between items-start">
                  <h3 className="text-xs font-semibold text-slate-200">{group.name}</h3>
                  <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {group.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{group.description}</p>
                <div className="flex space-x-3 mt-2 text-[10px] text-slate-500 font-mono">
                  <span>{group.membersCount.toLocaleString()} Members</span>
                  <span>•</span>
                  <span>{group.postsCount} Shared Threads</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Coping Companion Card */}
        <div className="bg-gradient-to-b from-indigo-950/15 to-transparent rounded-2xl border border-indigo-500/10 p-5 shadow-lg" id="ai-coping-card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-light tracking-wider text-slate-100 flex items-center uppercase" style={{ fontFamily: "Georgia, serif" }}>
              <Sparkles className="w-4 h-4 text-indigo-400 mr-2" />
              AI Coping Companion
            </h2>
            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider border border-indigo-500/35">
              Gemini 3.5
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
            Instantly formulate tailored somatic and cognitive exercises. Designed in tandem with CBT experts.
          </p>
          <div className="space-y-3 text-left">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Trigger Theme</label>
              <select 
                id="ai-struggle-select" 
                value={selectedStruggle} 
                onChange={(e) => setSelectedStruggle(e.target.value)} 
                className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-[#0A0A0C] [color-scheme:dark]"
              >
                <option value="Social Anxiety & Public Speaking">Social Anxiety & Public Speaking</option>
                <option value="Executive Dysfunction & ADHD Focus">Executive Dysfunction & ADHD Focus</option>
                <option value="Impending Panic/Dizzy Attack">Impending Panic/Dizzy Attack</option>
                <option value="Workplace Imposter Baseline Dread">Workplace Imposter Baseline Dread</option>
                <option value="Insomnia & Racing Thoughts">Insomnia & Racing Thoughts</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Or Describe Custom Scenario</label>
              <input 
                id="ai-custom-struggle-input" 
                type="text" 
                placeholder="e.g., Fear of flying tomorrow morning..." 
                value={customStruggle} 
                onChange={(e) => setCustomStruggle(e.target.value)} 
                className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-500" 
              />
            </div>
            <button 
              id="ai-trigger-btn" 
              onClick={handleGenerateCopingGuide} 
              disabled={isGenerating} 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{isGenerating ? "Consulting Clinician..." : "Draft Coping Roadmaps"}</span>
            </button>
          </div>
          
          {(isGenerating || aiResponse) && (
            <div className="mt-4 p-3.5 bg-white/[0.01] border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed shadow-lg" id="ai-response-box">
              {isGenerating ? (
                <div className="flex flex-col items-center py-4 space-y-2">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-slate-500 text-[10px]">Formulating supportive clinical roadmap...</span>
                </div>
              ) : (
                <div className="prose max-w-full text-[11px] text-slate-300">
                  <div className="flex items-center space-x-1.5 text-indigo-400 font-bold mb-2 border-b border-white/5 pb-1">
                    <Check className="w-4 h-4" />
                    <span>CBT Strategy Briefing</span>
                  </div>
                  <div className="whitespace-pre-line text-left">{aiResponse}</div>
                  <div className="mt-3 text-[9px] text-slate-505 text-center italic border-t border-white/5 pt-2">
                    Note: Generative plans are for general coping support and do not replace professional therapy.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle Feed Column */}
      <div className="lg:col-span-5 space-y-6 animate-fade-in" id="middle-feed">
        
        {/* Instagram/Facebook style Circular Stories bar */}
        <div className="bg-[#0D0D0F] border border-white/5 rounded-2xl p-4 shadow-lg">
          <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3 block text-left">Wellness Stories</h3>
          <div className="flex items-center space-x-4 overflow-x-auto pb-1 scrollbar-none">
            {/* Create Story Circle */}
            <div className="flex flex-col items-center space-y-1.5 shrink-0 cursor-pointer" onClick={() => setIsNewStoryModalOpen(true)}>
              <div className="w-14 h-14 rounded-full bg-slate-900 border border-dashed border-slate-700 flex items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-white transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold font-sans">Add Story</span>
            </div>

            {/* Existing Stories Circles */}
            {stories.map((story) => {
              const isDoc = story.authorRole === "psychologist";
              const borderClass = isDoc 
                ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-[#0A0A0C] border-2 border-transparent" 
                : "ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0A0A0C] border-2 border-transparent";
              return (
                <div 
                  key={story.id} 
                  className="flex flex-col items-center space-y-1.5 shrink-0 cursor-pointer" 
                  onClick={() => {
                    setActiveStoryId(story.id);
                    setActiveSlideIdx(0);
                  }}
                >
                  <img 
                    src={story.authorAvatar} 
                    alt={story.authorName} 
                    className={`w-14 h-14 rounded-full object-cover transition-transform hover:scale-105 ${borderClass}`} 
                  />
                  <span className="text-[10px] text-slate-300 font-medium truncate max-w-[65px]">{story.authorName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start a Therapeutic Thread */}
        <div className="bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg" id="post-creator-card">
          <h2 className="text-sm font-light tracking-wider text-slate-100 mb-4 uppercase" style={{ fontFamily: "Georgia, serif" }}>
            Start a Therapeutic Thread
          </h2>
          <form onSubmit={handleCreatePost} className="space-y-3.5">
            <input 
              id="new-post-title" 
              type="text" 
              placeholder="Discussion Title / Query..." 
              required 
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)} 
              className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 focus:bg-[#0A0A0C] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
            />
            <textarea 
              id="new-post-content" 
              placeholder="What is on your mind? Mention coping challenges or professional queries..." 
              required 
              rows={4} 
              value={newContent} 
              onChange={(e) => setNewContent(e.target.value)} 
              className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 focus:bg-[#0A0A0C] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed" 
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="text-left">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Primary Category</label>
                <select 
                  id="new-post-category" 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)} 
                  className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Wellness">Wellness</option>
                  <option value="Anxiety">Anxiety</option>
                  <option value="General">General</option>
                  <option value="Depression">Depression</option>
                  <option value="Somatic">Somatic</option>
                  <option value="Support">Support</option>
                </select>
              </div>
              <div className="text-left">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Custom Extra Tags</label>
                <input 
                  id="new-post-tags" 
                  type="text" 
                  placeholder="Comma separated (e.g., ADHD, Grief)" 
                  value={tagsInput} 
                  onChange={(e) => setTagsInput(e.target.value)} 
                  className="w-full bg-white/[0.02] border border-white/5 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-500" 
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500 font-mono">Security Node: TLS Encrypted</span>
              <div className="flex items-center space-x-2">
                <label htmlFor="anonymous-chk" className="text-xs text-slate-400 flex items-center cursor-pointer select-none">
                  <EyeOff className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
                  Post Anonymously
                </label>
                <input 
                  id="anonymous-chk" 
                  type="checkbox" 
                  checked={isAnonymous} 
                  onChange={(e) => setIsAnonymous(e.target.checked)} 
                  className="w-4 h-4 text-indigo-550 border-white/10 rounded-md focus:ring-indigo-500 bg-white/[0.03] accent-indigo-600 cursor-pointer" 
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <span className="text-[10px] text-slate-500 font-mono">
                Log node as <span className="font-semibold text-slate-400">{currentUser.name.split(",")[0]}</span>
              </span>
              <button 
                id="submit-post-btn" 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-widest font-bold px-4 py-2 rounded-lg transition shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Publish</span>
              </button>
            </div>
          </form>
        </div>

        {/* Filter Therapeutic Stream Search box */}
        <div className="bg-[#0D0D0F] rounded-2xl border border-white/5 p-4 shadow-md text-left" id="feed-search-section">
          <label htmlFor="feed-search-input" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Filter Therapeutic Stream
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input 
              id="feed-search-input" 
              type="text" 
              placeholder="Filter by keyword, hashtag, writer, or therapist..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-white/[0.02] border border-white/5 text-slate-100 placeholder:text-slate-650 rounded-xl pl-10 pr-16 py-2.5 text-xs outline-none focus:border-indigo-500/50 transition font-medium" 
            />
            {searchQuery && (
              <button 
                id="clear-search-btn" 
                type="button" 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-2 px-2 py-1 text-[9px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-md transition font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Reddit-style Sorting tabs and Tag filter row */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2" id="sorting-header">
            <div className="flex space-x-2 bg-slate-950 p-1 rounded-xl border border-white/5">
              {[
                { name: "Hot", icon: Flame },
                { name: "New", icon: Clock },
                { name: "Top", icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSel = sortBy === tab.name;
                return (
                  <button 
                    key={tab.name} 
                    onClick={() => setSortBy(tab.name)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${isSel ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
            
            <span className="text-[10px] font-mono text-slate-500">{processedPosts.length} Threads</span>
          </div>

          {/* Hashtag Filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none" id="tag-filters">
            <button 
              onClick={() => setSelectedTag(null)} 
              className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition shrink-0 cursor-pointer ${selectedTag === null ? "bg-indigo-600 text-white shadow-md" : "bg-white/[0.03] border border-white/5 text-slate-400 hover:text-slate-100"}`}
            >
              All Discussions
            </button>
            {allTags.map((tag) => (
              <button 
                key={tag} 
                onClick={() => setSelectedTag(tag)} 
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition shrink-0 cursor-pointer ${selectedTag === tag ? "bg-indigo-600 text-white shadow-md" : "bg-white/[0.03] border border-white/5 text-slate-400 hover:text-slate-100"}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Discussions List */}
        <div className="space-y-5" id="discussions-list">
          {processedPosts.map((post) => {
            const isProfessional = post.authorRole === "psychologist";
            const upvotedBy = post.upvotedBy || [];
            const downvotedBy = post.downvotedBy || [];
            const userUpvoted = upvotedBy.includes(currentUser.id);
            const userDownvoted = downvotedBy.includes(currentUser.id);
            const karmaVal = (post.upvotes || 0) - (post.downvotes || 0);

            // Compute total emoji reaction count
            const reactionKeys = Object.keys(post.reactions || {});
            const totalReactions = reactionKeys.reduce((sum, key) => sum + (post.reactions?.[key] || 0), 0);

            return (
              <article key={post.id} id={`post-card-${post.id}`} className={`bg-[#0D0D0F] rounded-2xl p-5 shadow-lg border relative flex space-x-4 ${isProfessional ? "border-[#9a3412]/30 bg-[#7c2d12]/5" : "border-white/5"}`}>
                
                {/* Reddit-style Vertical Vote Pillar */}
                <div className="flex flex-col items-center space-y-1.5 shrink-0 bg-white/[0.01] px-2 py-3 rounded-xl border border-white/5 h-fit self-start">
                  <button 
                    onClick={() => handleUpvote(post.id)}
                    className={`hover:text-orange-500 transition cursor-pointer ${userUpvoted ? 'text-orange-500 scale-110' : 'text-slate-500'}`}
                    title="Upvote (Coping value)"
                  >
                    <ArrowUp className="w-4.5 h-4.5" />
                  </button>
                  <span className={`text-xs font-mono font-bold ${karmaVal > 0 ? 'text-orange-400' : karmaVal < 0 ? 'text-blue-400' : 'text-slate-400'}`}>
                    {karmaVal}
                  </span>
                  <button 
                    onClick={() => handleDownvote(post.id)}
                    className={`hover:text-blue-500 transition cursor-pointer ${userDownvoted ? 'text-blue-500 scale-110' : 'text-slate-500'}`}
                    title="Downvote"
                  >
                    <ArrowDown className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center space-x-2.5">
                      <img src={post.authorAvatar} alt={post.authorName} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/5" />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-xs text-slate-200 leading-none">{post.authorName}</span>
                          {isProfessional && (
                            <span className="flex items-center space-x-0.5 bg-orange-950/20 border border-orange-500/30 text-orange-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md">
                              <Award className="w-2.5 h-2.5 text-orange-400" />
                              <span>Professional</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-550 mt-0.5 block font-mono">
                          {new Date(post.timestamp).toLocaleDateString()} at {new Date(post.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 mb-2 leading-snug hover:text-indigo-400 transition italic" style={{ fontFamily: "Georgia, serif" }}>
                    {post.title}
                  </h3>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed whitespace-pre-line mb-4 font-sans">
                    {post.content}
                  </p>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {post.tags?.map((tg) => {
                      const isPrimary = ["Wellness", "Anxiety", "General", "Depression", "Somatic", "Support"].includes(tg);
                      return (
                        <span 
                          key={tg} 
                          onClick={() => setSelectedTag(tg)} 
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded border cursor-pointer transition uppercase ${isPrimary ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold" : "bg-white/[0.03] border border-white/5 text-slate-400 hover:text-slate-100"}`}
                        >
                          #{tg}
                        </span>
                      );
                    })}
                  </div>

                  {/* Facebook-style Emoji Reaction summary bar */}
                  {totalReactions > 0 && (
                    <div className="flex items-center space-x-1.5 mb-4 bg-white/[0.01] border border-white/5 rounded-xl px-2.5 py-1.5 w-fit">
                      <div className="flex -space-x-1">
                        {reactionKeys.filter(k => (post.reactions?.[k] || 0) > 0).map(k => (
                          <span key={k} className="text-xs">{k}</span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-semibold">{totalReactions} Reactions</span>
                    </div>
                  )}

                  {/* Engagement Bar */}
                  <div className="flex items-center space-x-4 border-t border-white/5 pt-3 text-xs text-slate-500 font-mono font-medium relative">
                    
                    {/* Hover Reaction Trigger */}
                    <div 
                      className="relative"
                      onMouseEnter={() => setHoveredPostId(post.id)}
                      onMouseLeave={() => setHoveredPostId(null)}
                    >
                      <button className="flex items-center space-x-1.5 py-1 px-2.5 rounded-lg hover:bg-white/[0.03] hover:text-rose-400 transition cursor-pointer">
                        <Heart className="w-3.5 h-3.5" />
                        <span>React</span>
                      </button>

                      {/* Floating Reactions Drawer */}
                      <AnimatePresence>
                        {hoveredPostId === post.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: -42, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute z-50 left-0 bg-slate-900 border border-white/10 rounded-full px-3 py-1.5 flex items-center space-x-3 shadow-2xl backdrop-blur-md"
                          >
                            {["👍", "❤️", "🧘", "💡", "😮"].map(emoji => (
                              <button 
                                key={emoji} 
                                onClick={() => handleReact(post.id, emoji)}
                                className="text-lg hover:scale-130 transition cursor-pointer select-none"
                              >
                                {emoji}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button 
                      id={`comments-icon-btn-${post.id}`} 
                      onClick={() => setActivePostIdForComment(activePostIdForComment === post.id ? null : post.id)} 
                      className="flex items-center space-x-1.5 py-1 px-2.5 rounded-lg hover:bg-white/[0.03] hover:text-indigo-400 transition cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="font-semibold">{post.comments?.length || 0} Comments</span>
                    </button>
                  </div>

                  {/* Comments Block */}
                  {(activePostIdForComment === post.id || (post.comments || []).length > 0) && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-4" id={`comments-block-${post.id}`}>
                      <div className="space-y-4">
                        {(() => {
                          const rootComments = (post.comments || []).filter((c) => !c.parentId);
                          return rootComments.map((comment) => {
                            const childReplies = (post.comments || []).filter((c) => c.parentId === comment.id);
                            return (
                              <div key={comment.id} id={`comment-root-container-${comment.id}`} className="space-y-2.5">
                                <div id={`comment-${comment.id}`} className="flex space-x-3 bg-white/[0.01] p-3 rounded-xl border border-white/5 text-xs text-left">
                                  <img src={comment.authorAvatar} alt={comment.authorName} className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white/10" />
                                  <div className="text-left space-y-1.5 flex-1 select-text">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-1.5">
                                        <span className="font-bold text-slate-300">{comment.authorName}</span>
                                        {comment.authorRole === "psychologist" && (
                                          <span className="bg-orange-500/20 text-orange-400 text-[8px] font-semibold px-1 rounded uppercase tracking-wider">Doc</span>
                                        )}
                                      </div>
                                      <span className="text-[8px] text-slate-500 font-mono">{new Date(comment.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-350 leading-relaxed">{comment.content}</p>
                                    <div className="pt-1 flex items-center space-x-2">
                                      <button 
                                        id={`reply-trigger-${comment.id}`} 
                                        type="button" 
                                        onClick={() => {
                                          setActiveReplyCommentId(activeReplyCommentId === comment.id ? null : comment.id);
                                          setReplyText("");
                                        }} 
                                        className="text-[9px] text-indigo-400 hover:text-indigo-300 hover:underline font-bold tracking-wide uppercase transition cursor-pointer"
                                      >
                                        Reply
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Reply Input Box */}
                                {activeReplyCommentId === comment.id && (
                                  <div className="flex space-x-2 pl-8 pr-1 animate-fade-in" id={`reply-form-${comment.id}`}>
                                    <div className="flex items-center text-slate-500 shrink-0">
                                      <CornerDownRight className="w-4 h-4 text-indigo-500/60" />
                                    </div>
                                    <input 
                                      id={`reply-input-${comment.id}`} 
                                      type="text" 
                                      placeholder={`Reply to ${comment.authorName.split(",")[0]}...`} 
                                      value={replyText} 
                                      onChange={(e) => setReplyText(e.target.value)} 
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleAddReply(post.id, comment.id);
                                      }} 
                                      className="flex-1 bg-white/[0.02] border border-white/5 text-slate-100 text-xs rounded-xl px-3 py-2 focus:bg-[#0A0A0C] focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                                    />
                                    <button 
                                      id={`reply-submit-btn-${comment.id}`} 
                                      type="button" 
                                      onClick={() => handleAddReply(post.id, comment.id)} 
                                      className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer shrink-0"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}

                                {/* Render Child Replies */}
                                {childReplies.length > 0 && (
                                  <div className="space-y-2 pl-6 md:pl-8 border-l border-white/5 ml-3.5" id={`replies-list-${comment.id}`}>
                                    {childReplies.map((reply) => (
                                      <div key={reply.id} id={`comment-reply-${reply.id}`} className="flex space-x-2.5 bg-white/[0.005] p-2.5 rounded-xl border border-white/5 text-xs text-left">
                                        <div className="flex items-center text-slate-500 shrink-0">
                                          <CornerDownRight className="w-3.5 h-3.5 text-indigo-500/40" />
                                        </div>
                                        <img src={reply.authorAvatar} alt={reply.authorName} className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/10" />
                                        <div className="text-left space-y-1 flex-1 select-text">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-1.5">
                                              <span className="font-semibold text-slate-350">{reply.authorName}</span>
                                              {reply.authorRole === "psychologist" && (
                                                <span className="bg-orange-500/20 text-orange-400 text-[8px] font-semibold px-1 rounded uppercase tracking-wider">Doc</span>
                                              )}
                                            </div>
                                            <span className="text-[8px] text-slate-500 font-mono">{new Date(reply.timestamp).toLocaleDateString()}</span>
                                          </div>
                                          <p className="text-slate-300 leading-relaxed">{reply.content}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Parent Comment Input */}
                      <div className="flex space-x-2 pt-2 border-t border-white/5" id={`global-comment-form-${post.id}`}>
                        <input 
                          id={`post-${post.id}-comment-input`} 
                          type="text" 
                          placeholder="Write a supportive parent comment..." 
                          value={commentTextState[post.id] || ""} 
                          onChange={(e) => setCommentTextState({ ...commentTextState, [post.id]: e.target.value })} 
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(post.id);
                          }} 
                          className="flex-1 bg-white/[0.02] border border-white/5 text-slate-200 text-xs rounded-xl px-3 py-2 focus:bg-[#0A0A0C] focus:ring-1 focus:ring-indigo-500 focus:outline-none" 
                        />
                        <button 
                          id={`post-${post.id}-comment-send`} 
                          onClick={() => handleAddComment(post.id)} 
                          className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-550 transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-span-3 space-y-6" id="right-sidebar">
        {/* Safety Disclaimer */}
        <div className="bg-orange-950/20 border border-orange-500/20 rounded-2xl p-4 text-[11px]" id="disclaimer-card">
          <h3 className="font-bold text-orange-400 flex items-center mb-1.5 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-orange-500 mr-1.5" />
            Safety Disclaimer
          </h3>
          <p className="text-slate-400 leading-relaxed italic">
            PsychConnect is a professional tele-networking simulator. If you are experiencing a severe psychiatric crisis, please call emergency lines (such as 988 in the US) or visit a local care center immediately. Continuous support is vital.
          </p>
        </div>

        {/* Daily Coping Habits */}
        <div className="bg-[#0D0D0F] rounded-2xl border border-white/5 p-4 shadow-lg text-left" id="daily-activities-card">
          <h3 className="font-light text-slate-200 text-xs mb-4 block uppercase tracking-wider" style={{ fontFamily: "Georgia, serif" }}>
            Daily Coping Habits
          </h3>
          <div className="space-y-4">
            <div className="flex space-x-3">
              <div className="mt-0.5 text-indigo-400 font-mono text-xs bg-indigo-500/10 w-5 h-5 rounded border border-indigo-500/25 flex items-center justify-center shrink-0">1</div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Mindful Respiration</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Practice 3 breath cycles in our Video Consultation room's specialized visual coach.
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="mt-0.5 text-indigo-400 font-mono text-xs bg-indigo-500/10 w-5 h-5 rounded border border-indigo-500/25 flex items-center justify-center shrink-0">2</div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Support Group Dialogue</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Participate in our Corporate Fatigue support forum to trade daily boundary routines.
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="mt-0.5 text-indigo-400 font-mono text-xs bg-indigo-500/10 w-5 h-5 rounded border border-indigo-500/25 flex items-center justify-center shrink-0">3</div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Somatic Homework</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Log physical stressors in the profile dashboard for review with your matching counselor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Slideshow Fullscreen Modal overlay */}
      {activeStoryId !== null && currentStoryObj && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/90 flex items-center justify-center backdrop-blur-sm px-4">
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl text-left space-y-4">
            
            {/* Top Close indicator and slide progress bar */}
            <div className="space-y-3">
              {/* Slide Bars */}
              <div className="flex space-x-1">
                {currentStoryObj.slides.map((_, idx) => (
                  <div key={idx} className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-505 rounded-full transition-all duration-300"
                      style={{ 
                        width: idx < activeSlideIdx ? "100%" : idx === activeSlideIdx ? "100%" : "0%",
                        transitionDuration: idx === activeSlideIdx ? "4500ms" : "0ms",
                        transitionTimingFunction: "linear"
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Author header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img src={currentStoryObj.authorAvatar} alt={currentStoryObj.authorName} className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30" />
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">{currentStoryObj.authorName}</h4>
                    <span className="text-[9px] text-slate-405 capitalize">{currentStoryObj.authorRole}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveStoryId(null)}
                  className="p-1 hover:bg-white/10 rounded-full text-slate-450 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slide Content Box */}
            <div className="bg-slate-950 border border-white/5 rounded-xl p-8 min-h-[220px] flex items-center justify-center text-center">
              <p className="text-slate-200 text-sm leading-relaxed font-sans italic">
                {currentStoryObj.slides[activeSlideIdx]?.text}
              </p>
            </div>

            {/* Story Navigation Controls */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <button 
                onClick={() => {
                  if (activeSlideIdx > 0) {
                    setActiveSlideIdx(prev => prev - 1);
                  } else {
                    const currentIdx = stories.findIndex(s => s.id === activeStoryId);
                    if (currentIdx > 0) {
                      setActiveStoryId(stories[currentIdx - 1].id);
                      setActiveSlideIdx(stories[currentIdx - 1].slides.length - 1);
                    }
                  }
                }}
                className="flex items-center space-x-1 hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <span className="font-mono text-[10px]">{activeSlideIdx + 1} / {currentStoryObj.slides.length}</span>
              <button 
                onClick={() => {
                  if (activeSlideIdx < currentStoryObj.slides.length - 1) {
                    setActiveSlideIdx(prev => prev + 1);
                  } else {
                    const currentIdx = stories.findIndex(s => s.id === activeStoryId);
                    if (currentIdx < stories.length - 1) {
                      setActiveStoryId(stories[currentIdx + 1].id);
                      setActiveSlideIdx(0);
                    } else {
                      setActiveStoryId(null);
                    }
                  }
                }}
                className="flex items-center space-x-1 hover:text-white transition cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Story Modal */}
      {isNewStoryModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 flex items-center justify-center backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-5 shadow-2xl text-left space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Publish a Wellness Story</h3>
              <button onClick={() => setIsNewStoryModalOpen(false)} className="text-slate-400 hover:text-white transition cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Story Text Content</label>
              <textarea 
                rows={4}
                placeholder="Share a grounding tip or a wellness milestone you achieved today..."
                value={newStoryText}
                onChange={(e) => setNewStoryText(e.target.value)}
                className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-202 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none placeholder-slate-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button 
                onClick={() => setIsNewStoryModalOpen(false)} 
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateStory}
                disabled={!newStoryText.trim()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
