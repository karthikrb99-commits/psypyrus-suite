/**
 * PsyPyrus AI - Offline Gamification Service
 * Handles XP, Levels, Badges, Quests, and the MindShop rewards database.
 */

const STORAGE_KEYS = {
    PRO_PROFILE: 'psypyrus_gamification_pro_profile',
    PAT_PROFILE: 'psypyrus_gamification_pat_profile',
    SHOP_PURCHASES: 'psypyrus_gamification_shop_purchases'
};

const DEFAULT_BADGES = {
    Professional: [
        { id: 'note_novice', name: 'Note Novice', desc: 'Wrote your first clinical note', icon: 'fa-pen-clip', color: '#4facfe' },
        { id: 'note_master', name: 'Scribe Master', desc: 'Wrote 5 clinical notes', icon: 'fa-feather-pointed', color: '#00f2fe' },
        { id: 'diagnostic_wizard', name: 'Diagnostic Wizard', desc: 'Matched 3 clinical criteria sets', icon: 'fa-wand-magic-sparkles', color: '#a18cd1' },
        { id: 'assessment_guru', name: 'Assessment Guru', desc: 'Completed 3 patient assessments', icon: 'fa-clipboard-question', color: '#ff9a9e' },
        { id: 'level_5_pro', name: 'EHR Champion', desc: 'Reached Clinician Level 5', icon: 'fa-trophy', color: '#f5a623' }
    ],
    Patient: [
        { id: 'mindful_start', name: 'First Breath', desc: 'Completed your first paced breathing session', icon: 'fa-wind', color: '#4facfe' },
        { id: 'gratitude_journal', name: 'Self-Awareness', desc: 'Logged mood and gratitude 3 times', icon: 'fa-book-open', color: '#00f2fe' },
        { id: 'homework_hero', name: 'Homework Hero', desc: 'Completed 3 therapy homework tasks', icon: 'fa-circle-check', color: '#16b981' },
        { id: 'meditation_monk', name: 'Meditation Monk', desc: 'Completed a meditation session', icon: 'fa-spa', color: '#a18cd1' },
        { id: 'level_5_pat', name: 'Zen Master', desc: 'Reached Patient Level 5', icon: 'fa-crown', color: '#f5a623' }
    ]
};

const DEFAULT_QUESTS = {
    Professional: [
        { id: 'write_note', title: 'Document SOAP Note', desc: 'Write a patient clinical/SOAP note', target: 2, current: 0, rewardXp: 40, completed: false, type: 'WRITE_NOTE' },
        { id: 'run_diag', title: 'Evaluate Diagnostics', desc: 'Run clinical matching in Diagnostics', target: 1, current: 0, rewardXp: 30, completed: false, type: 'RUN_DIAGNOSTIC' },
        { id: 'do_assess', title: 'Conduct Assessment', desc: 'Compile a patient screening instrument', target: 1, current: 0, rewardXp: 35, completed: false, type: 'COMPLETE_ASSESSMENT' },
        { id: 'assign_hw', title: 'Assign Homework', desc: 'Prescribe a CBT task to a patient', target: 1, current: 0, rewardXp: 20, completed: false, type: 'ASSIGN_HOMEWORK' }
    ],
    Patient: [
        { id: 'log_mood', title: 'Mood Check-in', desc: 'Log your current emotional state', target: 1, current: 0, rewardXp: 20, rewardCoins: 10, completed: false, type: 'LOG_MOOD' },
        { id: 'do_breathing', title: 'Somatic Breathing', desc: 'Complete paced diaphragmatic breathing', target: 1, current: 0, rewardXp: 25, rewardCoins: 15, completed: false, type: 'COMPLETE_BREATHING' },
        { id: 'complete_hw', title: 'CBT Homework Task', desc: 'Finish assigned therapist homework', target: 1, current: 0, rewardXp: 30, rewardCoins: 20, completed: false, type: 'COMPLETE_HOMEWORK' },
        { id: 'meditate', title: 'Mindful Meditation', desc: 'Complete a guided meditation session', target: 1, current: 0, rewardXp: 40, rewardCoins: 25, completed: false, type: 'MEDITATE' }
    ]
};

const SHOP_ITEMS = [
    { id: 'shop_sound_forest', name: 'Rainforest Atmosphere', desc: 'Unlock Rainforest ambient sounds in the Wellness Lounge.', price: 40, icon: 'fa-tree', category: 'Atmospheres' },
    { id: 'shop_sound_fire', name: 'Crackling Fireplace', desc: 'Unlock fireplace crackles in the Wellness Lounge.', price: 50, icon: 'fa-fire-burner', category: 'Atmospheres' },
    { id: 'shop_theme_glass', name: 'Glassmorphism Theme', desc: 'Enable ultra-premium translucent glass layout panels.', price: 80, icon: 'fa-magnifying-glass-chart', category: 'Themes' },
    { id: 'shop_theme_retro', name: 'Retro CRT Terminal Theme', desc: 'Cyberpunk green CRT styling for the EHR console.', price: 100, icon: 'fa-terminal', category: 'Themes' },
    { id: 'shop_avatar_lisa', name: 'Companion Lisa (AI)', desc: 'Unlock a personalized therapeutic companion avatar guide.', price: 150, icon: 'fa-face-laugh-beam', category: 'Companions' }
];

export class GamificationService {
    static init() {
        if (!localStorage.getItem(STORAGE_KEYS.PRO_PROFILE)) {
            const initialPro = {
                level: 1,
                xp: 0,
                nextLevelXp: 100,
                badges: [],
                quests: JSON.parse(JSON.stringify(DEFAULT_QUESTS.Professional)),
                stats: { notesWritten: 0, diagnosticsEvaluated: 0, assessmentsCompleted: 0, homeworkAssigned: 0 }
            };
            localStorage.setItem(STORAGE_KEYS.PRO_PROFILE, JSON.stringify(initialPro));
        }

        if (!localStorage.getItem(STORAGE_KEYS.PAT_PROFILE)) {
            const initialPat = {
                level: 1,
                xp: 0,
                nextLevelXp: 100,
                coins: 50, // 50 starting coins!
                badges: [],
                quests: JSON.parse(JSON.stringify(DEFAULT_QUESTS.Patient)),
                stats: { moodLogs: 0, breathingSessions: 0, homeworkCompleted: 0, meditations: 0 }
            };
            localStorage.setItem(STORAGE_KEYS.PAT_PROFILE, JSON.stringify(initialPat));
        }

        if (!localStorage.getItem(STORAGE_KEYS.SHOP_PURCHASES)) {
            localStorage.setItem(STORAGE_KEYS.SHOP_PURCHASES, JSON.stringify([]));
        }
    }

    static getProfile(role) {
        this.init();
        const key = role === 'Professional' ? STORAGE_KEYS.PRO_PROFILE : STORAGE_KEYS.PAT_PROFILE;
        return JSON.parse(localStorage.getItem(key));
    }

    static saveProfile(role, profile) {
        const key = role === 'Professional' ? STORAGE_KEYS.PRO_PROFILE : STORAGE_KEYS.PAT_PROFILE;
        localStorage.setItem(key, JSON.stringify(profile));
        window.dispatchEvent(new CustomEvent('psypyrus_gamification_change', { detail: { role, profile } }));
    }

    static getShopItems() {
        this.init();
        const purchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_PURCHASES)) || [];
        return SHOP_ITEMS.map(item => ({
            ...item,
            purchased: purchases.includes(item.id)
        }));
    }

    static purchaseItem(itemId) {
        this.init();
        const items = this.getShopItems();
        const item = items.find(i => i.id === itemId);
        if (!item) return { success: false, message: "Item not found." };
        if (item.purchased) return { success: false, message: "Item already purchased." };

        const patProfile = this.getProfile('Patient');
        if (patProfile.coins < item.price) {
            return { success: false, message: `Insufficient coins. You need ${item.price} coins.` };
        }

        // Deduct coins
        patProfile.coins -= item.price;
        this.saveProfile('Patient', patProfile);

        // Add to purchases
        const purchases = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHOP_PURCHASES)) || [];
        purchases.push(itemId);
        localStorage.setItem(STORAGE_KEYS.SHOP_PURCHASES, JSON.stringify(purchases));

        // Create log event
        const dbClass = window.PsyPyrusDatabase || null;
        if (dbClass && typeof dbClass.logAudit === 'function') {
            dbClass.logAudit("Shop Purchase Successful", `Unlocked reward item ${item.name} for ${item.price} MindCoins.`);
        }

        // Trigger global state update for shop
        window.dispatchEvent(new CustomEvent('psypyrus_db_change', { detail: { key: 'shop' } }));
        window.dispatchEvent(new CustomEvent('psypyrus_gamification_change', { detail: { role: 'Patient', profile: patProfile } }));

        return { success: true, message: `Successfully purchased ${item.name}!` };
    }

    static awardXp(role, amount, reason) {
        const profile = this.getProfile(role);
        if (!profile) return null;

        profile.xp += amount;
        let leveledUp = false;
        
        // Level up check loop (in case of double levels, though rare)
        while (profile.xp >= profile.nextLevelXp) {
            profile.xp -= profile.nextLevelXp;
            profile.level += 1;
            profile.nextLevelXp = Math.round(profile.nextLevelXp * 1.5);
            leveledUp = true;
            
            // Level up coin reward for patients
            if (role === 'Patient') {
                profile.coins += 50; // +50 coins on leveling up!
            }
        }

        // Save
        this.saveProfile(role, profile);

        // Display notifications
        if (leveledUp) {
            this.showToast(`🎉 LEVEL UP! You reached Level ${profile.level}!`, 'success');
            // Auto check badges for level 5
            if (profile.level >= 5) {
                const badgeId = role === 'Professional' ? 'level_5_pro' : 'level_5_pat';
                this.unlockBadge(role, badgeId);
            }
        } else {
            this.showToast(`+${amount} ${role} XP: ${reason}`, 'info');
        }

        return { level: profile.level, xp: profile.xp, leveledUp };
    }

    static awardCoins(role, amount, reason) {
        if (role !== 'Patient') return;
        const profile = this.getProfile('Patient');
        profile.coins += amount;
        this.saveProfile('Patient', profile);
        this.showToast(`🪙 +${amount} MindCoins: ${reason}`, 'success');
    }

    static trackAction(role, actionType, count = 1) {
        const profile = this.getProfile(role);
        if (!profile) return;

        // Update stats
        if (role === 'Professional') {
            if (actionType === 'WRITE_NOTE') profile.stats.notesWritten += count;
            if (actionType === 'RUN_DIAGNOSTIC') profile.stats.diagnosticsEvaluated += count;
            if (actionType === 'COMPLETE_ASSESSMENT') profile.stats.assessmentsCompleted += count;
            if (actionType === 'ASSIGN_HOMEWORK') profile.stats.homeworkAssigned += count;
        } else {
            if (actionType === 'LOG_MOOD') profile.stats.moodLogs += count;
            if (actionType === 'COMPLETE_BREATHING') profile.stats.breathingSessions += count;
            if (actionType === 'COMPLETE_HOMEWORK') profile.stats.homeworkCompleted += count;
            if (actionType === 'MEDITATE') profile.stats.meditations += count;
        }

        // Update active quests
        let questCompleted = false;
        profile.quests = profile.quests.map(quest => {
            if (quest.type === actionType && !quest.completed) {
                quest.current += count;
                if (quest.current >= quest.target) {
                    quest.current = quest.target;
                    quest.completed = true;
                    questCompleted = true;

                    // Delay awarding so notifications don't overlap too much
                    setTimeout(() => {
                        this.showToast(`🏆 Quest Completed: "${quest.title}"!`, 'success');
                        this.awardXp(role, quest.rewardXp, `Completed Quest "${quest.title}"`);
                        if (role === 'Patient' && quest.rewardCoins) {
                            this.awardCoins(role, quest.rewardCoins, `Completed Quest "${quest.title}"`);
                        }
                    }, 500);
                }
            }
            return quest;
        });

        this.saveProfile(role, profile);

        // Check stats-based badges
        this.checkBadgeThresholds(role, profile);
    }

    static checkBadgeThresholds(role, profile) {
        if (role === 'Professional') {
            if (profile.stats.notesWritten >= 1) this.unlockBadge(role, 'note_novice');
            if (profile.stats.notesWritten >= 5) this.unlockBadge(role, 'note_master');
            if (profile.stats.diagnosticsEvaluated >= 3) this.unlockBadge(role, 'diagnostic_wizard');
            if (profile.stats.assessmentsCompleted >= 3) this.unlockBadge(role, 'assessment_guru');
        } else {
            if (profile.stats.breathingSessions >= 1) this.unlockBadge(role, 'mindful_start');
            if (profile.stats.moodLogs >= 3) this.unlockBadge(role, 'gratitude_journal');
            if (profile.stats.homeworkCompleted >= 3) this.unlockBadge(role, 'homework_hero');
            if (profile.stats.meditations >= 1) this.unlockBadge(role, 'meditation_monk');
        }
    }

    static unlockBadge(role, badgeId) {
        const profile = this.getProfile(role);
        if (!profile || profile.badges.includes(badgeId)) return;

        profile.badges.push(badgeId);
        this.saveProfile(role, profile);

        const badgeInfo = DEFAULT_BADGES[role].find(b => b.id === badgeId);
        if (badgeInfo) {
            setTimeout(() => {
                this.showToast(`🏅 Badge Unlocked: ${badgeInfo.name}!`, 'success');
            }, 1000);
        }
    }

    static resetQuests(role) {
        const profile = this.getProfile(role);
        if (!profile) return;
        profile.quests = JSON.parse(JSON.stringify(DEFAULT_QUESTS[role]));
        this.saveProfile(role, profile);
        this.showToast(`Daily Quests refreshed!`, 'info');
    }

    static showToast(message, type = 'info') {
        // Dispatch event for toast
        window.dispatchEvent(new CustomEvent('psypyrus_toast', {
            detail: { message, type }
        }));
    }
}
GamificationService.init();
window.GamificationService = GamificationService;
