import { GeminiService } from "../../services/ai";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { MOCK_SUPPORT_GROUPS } from "../services/data";
import { Heart, MessageCircle, Shield, Award, Sparkles, Send, EyeOff, Check, AlertCircle, Search, CornerDownRight } from "lucide-react";
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
    // Gather unique tags for filtering
    const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));
    // Handle post creation
    const handleCreatePost = (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim())
            return;
        const tagsArray = tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
        // Build unique tags including the primary selectedCategory
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
            likes: 0,
            likedBy: [],
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
    // Handle Reply Submission (nested system)
    const handleAddReply = (postId, parentCommentId) => {
        if (!replyText.trim())
            return;
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
                    comments: [...post.comments, newComment]
                };
            }
            return post;
        }));
        setReplyText("");
        setActiveReplyCommentId(null);
    };
    // Handle Liking a Post
    const handleLike = (postId) => {
        setPosts(posts.map((post) => {
            if (post.id === postId) {
                const alreadyLiked = post.likedBy.includes(currentUser.id);
                return {
                    ...post,
                    likedBy: alreadyLiked
                        ? post.likedBy.filter((uid) => uid !== currentUser.id)
                        : [...post.likedBy, currentUser.id],
                    likes: alreadyLiked ? post.likes - 1 : post.likes + 1,
                };
            }
            return post;
        }));
    };
    // Handle Comment Submission
    const handleAddComment = (postId) => {
        const text = commentTextState[postId] || "";
        if (!text.trim())
            return;
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
                    comments: [...post.comments, newComment]
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
    }
        finally {
            setIsGenerating(false);
        }
    };
    // Filter posts by selected tag first, and then apply keyword/author search query if present
    const filteredPosts = posts.filter((post) => {
        // tag filter
        if (selectedTag && !post.tags.includes(selectedTag)) {
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
    });
    return (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 py-8", id: "social-feed-container", children: [_jsxs("div", { className: "lg:col-span-4 space-y-6", id: "left-sidebar", children: [_jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg", id: "support-groups-card", children: [_jsxs("h2", { className: "text-sm font-light tracking-wider text-slate-100 flex items-center mb-4 uppercase", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Shield, { className: "w-4 h-4 text-indigo-400 mr-2" }), "Moderated Support Groups"] }), _jsx("div", { className: "space-y-3", children: MOCK_SUPPORT_GROUPS.map((group) => (_jsxs("div", { id: `group-${group.id}`, className: "p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl transition cursor-pointer border border-white/5", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("h3", { className: "text-xs font-semibold text-slate-200", children: group.name }), _jsx("span", { className: "text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider", children: group.category })] }), _jsx("p", { className: "text-[11px] text-slate-400 mt-1 line-clamp-2", children: group.description }), _jsxs("div", { className: "flex space-x-3 mt-2 text-[10px] text-slate-500 font-mono", children: [_jsxs("span", { children: [group.membersCount.toLocaleString(), " Members"] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [group.postsCount, " Shared Threads"] })] })] }, group.id))) })] }), _jsxs("div", { className: "bg-gradient-to-b from-indigo-950/15 to-transparent rounded-2xl border border-indigo-500/10 p-5 shadow-lg", id: "ai-coping-card", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("h2", { className: "text-sm font-light tracking-wider text-slate-100 flex items-center uppercase", style: { fontFamily: "Georgia, serif" }, children: [_jsx(Sparkles, { className: "w-4 h-4 text-indigo-400 mr-2" }), "AI Coping Companion"] }), _jsx("span", { className: "text-[9px] bg-indigo-500/20 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider border border-indigo-500/35", children: "Gemini 3.5" })] }), _jsx("p", { className: "text-[11px] text-slate-400 mb-4 leading-relaxed", children: "Instantly formulate tailored somatic and cognitive exercises. Designed in tandem with CBT experts." }), _jsxs("div", { className: "space-y-3 text-left", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Select Trigger Theme" }), _jsxs("select", { id: "ai-struggle-select", value: selectedStruggle, onChange: (e) => setSelectedStruggle(e.target.value), className: "w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-[#0A0A0C] [color-scheme:dark]", children: [_jsx("option", { value: "Social Anxiety & Public Speaking", children: "Social Anxiety & Public Speaking" }), _jsx("option", { value: "Executive Dysfunction & ADHD Focus", children: "Executive Dysfunction & ADHD Focus" }), _jsx("option", { value: "Impending Panic/Dizzy Attack", children: "Impending Panic/Dizzy Attack" }), _jsx("option", { value: "Workplace Imposter Baseline Dread", children: "Workplace Imposter Baseline Dread" }), _jsx("option", { value: "Insomnia & Racing Midnight thoughts", children: "Insomnia & Racing Midnight thoughts" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Or Describe Custom Scenario" }), _jsx("input", { id: "ai-custom-struggle-input", type: "text", placeholder: "e.g., Fear of flying tomorrow morning...", value: customStruggle, onChange: (e) => setCustomStruggle(e.target.value), className: "w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-500" })] }), _jsxs("button", { id: "ai-trigger-btn", onClick: handleGenerateCopingGuide, disabled: isGenerating, className: "w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50", children: [_jsx(Sparkles, { className: "w-3.5 h-3.5 animate-pulse" }), _jsx("span", { children: isGenerating ? "Consulting Clinician..." : "Draft Coping roadmaps" })] })] }), (isGenerating || aiResponse) && (_jsx("div", { className: "mt-4 p-3.5 bg-white/[0.01] border border-white/5 rounded-xl text-xs text-slate-300 leading-relaxed shadow-lg", id: "ai-response-box", children: isGenerating ? (_jsxs("div", { className: "flex flex-col items-center py-4 space-y-2", children: [_jsx("div", { className: "w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-slate-500 text-[10px]", children: "Formulating supportive clinical roadmap..." })] })) : (_jsxs("div", { className: "prose max-w-full text-[11px] text-slate-300", children: [_jsxs("div", { className: "flex items-center space-x-1.5 text-indigo-400 font-bold mb-2 border-b border-white/5 pb-1", children: [_jsx(Check, { className: "w-4 h-4" }), _jsx("span", { children: "CBT Strategy Briefing" })] }), _jsx("div", { className: "whitespace-pre-line text-left", children: aiResponse }), _jsx("div", { className: "mt-3 text-[9px] text-slate-500 text-center italic border-t border-white/5 pt-2", children: "Note: Generative plans are for general coping support and do not replace professional therapy." })] })) }))] })] }), _jsxs("div", { className: "lg:col-span-5 space-y-6 animate-fade-in", id: "middle-feed", children: [_jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-5 shadow-lg", id: "post-creator-card", children: [_jsx("h2", { className: "text-sm font-light tracking-wider text-slate-100 mb-4 uppercase", style: { fontFamily: "Georgia, serif" }, children: "Start a Therapeutic Thread" }), _jsxs("form", { onSubmit: handleCreatePost, className: "space-y-3.5", children: [_jsx("input", { id: "new-post-title", type: "text", placeholder: "Discussion Title / Query...", required: true, value: newTitle, onChange: (e) => setNewTitle(e.target.value), className: "w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 focus:bg-[#0A0A0C] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none" }), _jsx("textarea", { id: "new-post-content", placeholder: "What is on your mind? Mention coping challenges or professional queries...", required: true, rows: 4, value: newContent, onChange: (e) => setNewContent(e.target.value), className: "w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 focus:bg-[#0A0A0C] text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "text-left", children: [_jsx("label", { htmlFor: "new-post-category", className: "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Primary Category" }), _jsxs("select", { id: "new-post-category", value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "w-full bg-[#0A0A0C] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none", children: [_jsx("option", { value: "Wellness", children: "Wellness" }), _jsx("option", { value: "Anxiety", children: "Anxiety" }), _jsx("option", { value: "General", children: "General" }), _jsx("option", { value: "Depression", children: "Depression" }), _jsx("option", { value: "Somatic", children: "Somatic" }), _jsx("option", { value: "Support", children: "Support" })] })] }), _jsxs("div", { className: "text-left", children: [_jsx("label", { htmlFor: "new-post-tags", className: "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1", children: "Custom Extra Tags" }), _jsx("input", { id: "new-post-tags", type: "text", placeholder: "Comma separated (e.g., ADHD, Grief)", value: tagsInput, onChange: (e) => setTagsInput(e.target.value), className: "w-full bg-white/[0.02] border border-white/5 text-slate-100 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-505" })] })] }), _jsxs("div", { className: "flex items-center justify-between pt-1", children: [_jsx("span", { className: "text-[10px] text-slate-550 font-mono", children: "Security Node: TLS Encrypted" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("label", { htmlFor: "anonymous-chk", className: "text-xs text-slate-400 flex items-center cursor-pointer select-none", children: [_jsx(EyeOff, { className: "w-3.5 h-3.5 text-slate-500 mr-1.5" }), "Post Anonymously"] }), _jsx("input", { id: "anonymous-chk", type: "checkbox", checked: isAnonymous, onChange: (e) => setIsAnonymous(e.target.checked), className: "w-4 h-4 text-indigo-500 border-white/10 rounded-md focus:ring-indigo-500 bg-white/[0.03] accent-indigo-600 cursor-pointer" })] })] }), _jsxs("div", { className: "flex justify-between items-center pt-3 border-t border-white/5", children: [_jsxs("span", { className: "text-[10px] text-slate-500 font-mono", children: ["Log node as ", _jsx("span", { className: "font-semibold text-slate-400", children: currentUser.name.split(",")[0] })] }), _jsxs("button", { id: "submit-post-btn", type: "submit", className: "bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-widest font-bold px-4 py-2 rounded-lg transition shadow-md cursor-pointer flex items-center space-x-1.5", children: [_jsx(Send, { className: "w-3 h-3" }), _jsx("span", { children: "Publish" })] })] })] })] }), _jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-4 shadow-md text-left", id: "feed-search-section", children: [_jsx("label", { htmlFor: "feed-search-input", className: "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2", children: "Filter Therapeutic Stream" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "w-4 h-4 text-slate-500 absolute left-3.5 top-3" }), _jsx("input", { id: "feed-search-input", type: "text", placeholder: "Filter by keyword, hashtag, writer, or therapist...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full bg-white/[0.02] border border-white/5 text-slate-100 placeholder:text-slate-600 rounded-xl pl-10 pr-16 py-2.5 text-xs outline-none focus:border-indigo-500/50 transition font-medium" }), searchQuery && (_jsx("button", { id: "clear-search-btn", type: "button", onClick: () => setSearchQuery(""), className: "absolute right-3 top-2 px-2 py-1 text-[9px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-md transition font-mono", children: "Clear" }))] })] }), _jsxs("div", { className: "flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none", id: "tag-filters", children: [_jsx("button", { onClick: () => setSelectedTag(null), className: `px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-semibold transition shrink-0 cursor-pointer ${selectedTag === null
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "bg-white/[0.03] border border-white/5 text-slate-400 hover:text-slate-100"}`, children: "All Discussions" }), allTags.map((tag) => (_jsxs("button", { onClick: () => setSelectedTag(tag), className: `px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-semibold transition shrink-0 cursor-pointer ${selectedTag === tag
                                    ? "bg-indigo-600 text-white shadow-md"
                                    : "bg-white/[0.03] border border-white/5 text-slate-400 hover:text-slate-100"}`, children: ["#", tag] }, tag)))] }), _jsx("div", { className: "space-y-5", id: "discussions-list", children: filteredPosts.map((post) => {
                            const isProfessional = post.authorRole === "psychologist";
                            const userLiked = post.likedBy.includes(currentUser.id);
                            return (_jsxs("article", { id: `post-card-${post.id}`, className: `bg-[#0D0D0F] rounded-2xl p-5 shadow-lg border relative ${isProfessional ? "border-[#9a3412]/30 bg-[#7c2d12]/5" : "border-white/5"}`, children: [_jsx("div", { className: "flex items-center justify-between mb-3.5", children: _jsxs("div", { className: "flex items-center space-x-2.5", children: [_jsx("img", { src: post.authorAvatar, alt: post.authorName, referrerPolicy: "no-referrer", className: "w-10 h-10 rounded-full object-cover ring-2 ring-white/5" }), _jsxs("div", { className: "text-left", children: [_jsxs("div", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "font-bold text-sm text-slate-200 leading-none", children: post.authorName }), isProfessional && (_jsxs("span", { className: "flex items-center space-x-0.5 bg-orange-950/20 border border-orange-500/30 text-orange-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md", children: [_jsx(Award, { className: "w-2.5 h-2.5 text-orange-400" }), _jsx("span", { children: "Professional" })] }))] }), _jsxs("span", { className: "text-[10px] text-slate-500 mt-0.5 block font-mono", children: [new Date(post.timestamp).toLocaleDateString(), " at", " ", new Date(post.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })] })] })] }) }), _jsx("h3", { className: "text-md font-bold text-slate-100 mb-2 leading-snug hover:text-indigo-400 transition italic", style: { fontFamily: "Georgia, serif" }, children: post.title }), _jsx("p", { className: "text-xs text-slate-300 leading-relaxed whitespace-pre-line mb-4 font-sans", children: post.content }), _jsx("div", { className: "flex flex-wrap gap-1.5 mb-4", children: post.tags.map((tg) => {
                                            const isPrimary = ["Wellness", "Anxiety", "General", "Depression", "Somatic", "Support"].includes(tg);
                                            return (_jsxs("span", { onClick: () => setSelectedTag(tg), className: `text-[10px] font-semibold px-2 py-0.5 rounded border cursor-pointer transition uppercase ${isPrimary
                                                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold"
                                                    : "bg-white/[0.03] border border-white/5 text-slate-400 hover:text-slate-100"}`, id: `tag-badge-${post.id}-${tg}`, children: ["#", tg] }, tg));
                                        }) }), _jsxs("div", { className: "flex items-center space-x-4 border-t border-white/5 pt-3 text-xs text-slate-500 font-mono font-medium", children: [_jsxs("button", { id: `like-btn-${post.id}`, onClick: () => handleLike(post.id), className: `flex items-center space-x-1.5 py-1 px-2 rounded-lg transition shrink-0 cursor-pointer ${userLiked ? "text-rose-400 bg-rose-500/10" : "hover:text-rose-400 hover:bg-white/[0.02]"}`, children: [_jsx(Heart, { className: `w-4 h-4 ${userLiked ? "fill-rose-500" : ""}` }), _jsx("span", { className: "font-semibold", children: post.likes })] }), _jsxs("button", { id: `comments-icon-btn-${post.id}`, onClick: () => setActivePostIdForComment(activePostIdForComment === post.id ? null : post.id), className: "flex items-center space-x-1.5 py-1 px-2 rounded-lg hover:bg-white/[0.02] hover:text-indigo-400 transition cursor-pointer", children: [_jsx(MessageCircle, { className: "w-4 h-4" }), _jsxs("span", { className: "font-semibold", children: [post.comments.length, " Comments"] })] })] }), (activePostIdForComment === post.id || post.comments.length > 0) && (_jsxs("div", { className: "mt-4 pt-4 border-t border-white/5 space-y-4", id: `comments-block-${post.id}`, children: [_jsx("div", { className: "space-y-4", children: (() => {
                                                    // Segregate root comments and nested replies
                                                    const rootComments = post.comments.filter((c) => !c.parentId);
                                                    return rootComments.map((comment) => {
                                                        const childReplies = post.comments.filter((c) => c.parentId === comment.id);
                                                        return (_jsxs("div", { id: `comment-root-container-${comment.id}`, className: "space-y-2.5", children: [_jsxs("div", { id: `comment-${comment.id}`, className: "flex space-x-3 bg-white/[0.01] p-3 rounded-xl border border-white/5 text-xs text-left", children: [_jsx("img", { src: comment.authorAvatar, alt: comment.authorName, referrerPolicy: "no-referrer", className: "w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white/10" }), _jsxs("div", { className: "text-left space-y-1.5 flex-1 select-text", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "font-bold text-slate-300", children: comment.authorName }), comment.authorRole === "psychologist" && (_jsx("span", { className: "bg-orange-500/20 text-orange-400 text-[8px] font-semibold px-1 rounded uppercase tracking-wider", children: "Doc" }))] }), _jsx("span", { className: "text-[9px] text-slate-500 font-mono", children: new Date(comment.timestamp).toLocaleDateString() })] }), _jsx("p", { className: "text-slate-300 leading-relaxed", children: comment.content }), _jsx("div", { className: "pt-1 flex items-center space-x-2", children: _jsx("button", { id: `reply-trigger-${comment.id}`, type: "button", onClick: () => {
                                                                                            setActiveReplyCommentId(activeReplyCommentId === comment.id ? null : comment.id);
                                                                                            setReplyText("");
                                                                                        }, className: "text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline font-bold tracking-wide uppercase transition cursor-pointer", children: "Reply" }) })] })] }), activeReplyCommentId === comment.id && (_jsxs("div", { className: "flex space-x-2 pl-8 pr-1 animate-fade-in", id: `reply-form-${comment.id}`, children: [_jsx("div", { className: "flex items-center text-slate-500 shrink-0", children: _jsx(CornerDownRight, { className: "w-4 h-4 text-indigo-500/60" }) }), _jsx("input", { id: `reply-input-${comment.id}`, type: "text", placeholder: `Reply to ${comment.authorName.split(",")[0]}...`, value: replyText, onChange: (e) => setReplyText(e.target.value), onKeyDown: (e) => {
                                                                                if (e.key === "Enter")
                                                                                    handleAddReply(post.id, comment.id);
                                                                            }, className: "flex-1 bg-white/[0.02] border border-white/5 text-slate-100 text-xs rounded-xl px-3 py-2 focus:bg-[#0A0A0C] focus:ring-1 focus:ring-indigo-500 focus:outline-none" }), _jsx("button", { id: `reply-submit-btn-${comment.id}`, type: "button", onClick: () => handleAddReply(post.id, comment.id), className: "p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer shrink-0", children: _jsx(Send, { className: "w-3.5 h-3.5" }) })] })), childReplies.length > 0 && (_jsx("div", { className: "space-y-2 pl-6 md:pl-8 border-l border-white/5 ml-3.5", id: `replies-list-${comment.id}`, children: childReplies.map((reply) => (_jsxs("div", { id: `comment-reply-${reply.id}`, className: "flex space-x-2.5 bg-white/[0.005]/50 p-2.5 rounded-xl border border-white/5/30 text-xs text-left", children: [_jsx("div", { className: "flex items-center text-slate-500 shrink-0", children: _jsx(CornerDownRight, { className: "w-3.5 h-3.5 text-indigo-500/40" }) }), _jsx("img", { src: reply.authorAvatar, alt: reply.authorName, referrerPolicy: "no-referrer", className: "w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-white/10" }), _jsxs("div", { className: "text-left space-y-1 flex-1 select-text", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "font-semibold text-slate-300", children: reply.authorName }), reply.authorRole === "psychologist" && (_jsx("span", { className: "bg-orange-500/20 text-orange-400 text-[8px] font-semibold px-1 rounded uppercase tracking-wider", children: "Doc" }))] }), _jsx("span", { className: "text-[9px] text-slate-500 font-mono", children: new Date(reply.timestamp).toLocaleDateString() })] }), _jsx("p", { className: "text-slate-350 leading-relaxed", children: reply.content })] })] }, reply.id))) }))] }, comment.id));
                                                    });
                                                })() }), _jsxs("div", { className: "flex space-x-2 pt-2 border-t border-white/5", id: `global-comment-form-${post.id}`, children: [_jsx("input", { id: `post-${post.id}-comment-input`, type: "text", placeholder: "Write a supportive parent comment...", value: commentTextState[post.id] || "", onChange: (e) => setCommentTextState({ ...commentTextState, [post.id]: e.target.value }), onKeyDown: (e) => {
                                                            if (e.key === "Enter")
                                                                handleAddComment(post.id);
                                                        }, className: "flex-1 bg-white/[0.02] border border-white/5 text-slate-200 text-xs rounded-xl px-3 py-2 focus:bg-[#0A0A0C] focus:ring-1 focus:ring-indigo-500 focus:outline-none" }), _jsx("button", { id: `post-${post.id}-comment-send`, onClick: () => handleAddComment(post.id), className: "p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition cursor-pointer", children: _jsx(Send, { className: "w-3.5 h-3.5" }) })] })] }))] }, post.id));
                        }) })] }), _jsxs("div", { className: "lg:col-span-3 space-y-6", id: "right-sidebar", children: [_jsxs("div", { className: "bg-orange-950/20 border border-orange-500/20 rounded-2xl p-4 text-[11px]", id: "disclaimer-card", children: [_jsxs("h3", { className: "font-bold text-orange-400 flex items-center mb-1.5 uppercase tracking-wider", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-orange-500 mr-1.5" }), "Safety Disclaimer"] }), _jsx("p", { className: "text-slate-400 leading-relaxed italic", children: "PsychConnect is a professional tele-networking simulator. If you are experiencing a severe psychiatric crisis, please call emergency lines (such as 988 in the US) or visit a local care center immediately. Continuous support is vital." })] }), _jsxs("div", { className: "bg-[#0D0D0F] rounded-2xl border border-white/5 p-4 shadow-lg text-left", id: "daily-activities-card", children: [_jsx("h3", { className: "font-light text-slate-200 text-xs mb-4 block uppercase tracking-wider", style: { fontFamily: "Georgia, serif" }, children: "Daily Coping Habits" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex space-x-3", children: [_jsx("div", { className: "mt-0.5 text-indigo-400 font-mono text-xs bg-indigo-500/10 w-5 h-5 rounded border border-indigo-500/25 flex items-center justify-center shrink-0", children: "1" }), _jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold text-slate-200", children: "Mindful Respiration" }), _jsx("p", { className: "text-[11px] text-slate-400 mt-0.5 leading-relaxed", children: "Practice 3 breath cycles in our Video Consultation room's specialized visual coach." })] })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("div", { className: "mt-0.5 text-indigo-400 font-mono text-xs bg-indigo-500/10 w-5 h-5 rounded border border-indigo-500/25 flex items-center justify-center shrink-0", children: "2" }), _jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold text-slate-200", children: "Support Group Dialogue" }), _jsx("p", { className: "text-[11px] text-slate-400 mt-0.5 leading-relaxed", children: "Participate in our Corporate Fatigue support forum to trade daily boundary routines." })] })] }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("div", { className: "mt-0.5 text-indigo-400 font-mono text-xs bg-indigo-500/10 w-5 h-5 rounded border border-indigo-500/25 flex items-center justify-center shrink-0", children: "3" }), _jsxs("div", { children: [_jsx("h4", { className: "text-xs font-semibold text-slate-200", children: "Somatic Homework" }), _jsx("p", { className: "text-[11px] text-slate-400 mt-0.5 leading-relaxed", children: "Log physical stressors in the profile dashboard for review with your matching counselor." })] })] })] })] })] })] }));
}
