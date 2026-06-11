import SwiftUI

public struct MindShopView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    
    // Available rewards for purchase
    private let shopItems = [
        (id: "rainforest_audio", title: "Rainforest Soundscape", category: "Ambient Audio", desc: "Soothing nature soundscape designed for grounding during stress pacing.", cost: 15, icon: "waveform"),
        (id: "crt_skin", title: "Retro CRT Scanline Filter", category: "Visual Skin", desc: "Applies a classic CRT raster scanline visual layout to all screens.", cost: 35, icon: "tv"),
        (id: "cyberpunk_skin", title: "Neon Cyberpunk Theme", category: "Visual Skin", desc: "Dark neon cyan and pink color scheme overlay with glowing borders.", cost: 50, icon: "sparkles"),
        (id: "lisa_ai", title: "Lisa AI Companion Upgrade", category: "AI Companion", desc: "Unlocks advanced proactive support and conversation logs with Lisa.", cost: 100, icon: "brain")
    ]
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            
            // Header Bar with coin balance
            HStack(spacing: 12) {
                Image(systemName: "cart.fill")
                    .foregroundColor(PremiumTheme.patientPrimary)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("MindShop Lounge")
                        .font(.title3)
                        .fontWeight(.bold)
                    Text("Spend MindCoins earned from wellness exercises on premiums")
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
                Spacer()
                
                // Coin Badge
                HStack(spacing: 6) {
                    Image(systemName: "circle.circle.fill")
                        .foregroundColor(PremiumTheme.accentYellow)
                        .font(.footnote)
                    Text("\(viewModel.mindCoins) Coins")
                        .font(.footnote)
                        .fontWeight(.bold)
                        .foregroundColor(PremiumTheme.accentYellow)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(PremiumTheme.accentYellow.opacity(0.15))
                .cornerRadius(12)
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 20) {
                    
                    // Quick earning simulator for demo
                    GlassmorphicCard(isLight: viewModel.theme == "light") {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("WELLNESS PROGRESS ACTION")
                                    .font(.system(size: 8))
                                    .fontWeight(.bold)
                                    .foregroundColor(.gray)
                                Text("Complete daily breathing exercise")
                                    .font(.subheadline)
                                    .fontWeight(.bold)
                            }
                            Spacer()
                            Button(action: {
                                viewModel.addMindCoins(amount: 10)
                                viewModel.addClinicianXp(amount: 5)
                            }) {
                                Text("+10 Coins")
                                    .font(.caption2)
                                    .fontWeight(.bold)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(PremiumTheme.patientPrimary)
                                    .foregroundColor(.white)
                                    .cornerRadius(8)
                            }
                        }
                    }
                    
                    // Shop listings
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Available Rewards")
                            .font(.headline)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                        
                        ForEach(shopItems, id: \.id) { item in
                            let isOwned = viewModel.unlockedSkins.contains(item.title)
                            let isEquipped = viewModel.theme == item.title.lowercased()
                            
                            HStack(spacing: 12) {
                                // Left Icon
                                Image(systemName: item.icon)
                                    .font(.title2)
                                    .foregroundColor(PremiumTheme.patientPrimary)
                                    .frame(width: 44, height: 44)
                                    .background(PremiumTheme.patientPrimary.opacity(0.12))
                                    .cornerRadius(10)
                                
                                // Description
                                VStack(alignment: .leading, spacing: 2) {
                                    HStack {
                                        Text(item.title)
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                        Spacer()
                                        
                                        if isOwned {
                                            StatusBadge(text: "Unlocked", type: .success)
                                        } else {
                                            HStack(spacing: 2) {
                                                Image(systemName: "circle.circle.fill")
                                                    .foregroundColor(PremiumTheme.accentYellow)
                                                    .font(.system(size: 9))
                                                Text("\(item.cost) Coins")
                                                    .font(.caption2)
                                                    .fontWeight(.semibold)
                                                    .foregroundColor(PremiumTheme.accentYellow)
                                            }
                                        }
                                    }
                                    
                                    Text(item.desc)
                                        .font(.caption2)
                                        .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textSecondaryLight : PremiumTheme.textSecondaryDark)
                                        .lineLimit(nil)
                                }
                                Spacer()
                                
                                // Purchase or Equip Button
                                if isOwned {
                                    if item.category == "Visual Skin" {
                                        Button(action: {
                                            viewModel.saveTheme(item.title.lowercased())
                                        }) {
                                            Text(isEquipped ? "Equipped" : "Equip")
                                                .font(.caption2)
                                                .fontWeight(.bold)
                                                .padding(.horizontal, 10)
                                                .padding(.vertical, 6)
                                                .background(isEquipped ? Color.gray : PremiumTheme.patientPrimary)
                                                .foregroundColor(.white)
                                                .cornerRadius(6)
                                        }
                                        .disabled(isEquipped)
                                    } else {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(PremiumTheme.success)
                                    }
                                } else {
                                    Button(action: {
                                        let success = viewModel.unlockSkin(skinName: item.title, cost: item.cost)
                                        if success && item.category == "Visual Skin" {
                                            viewModel.saveTheme(item.title.lowercased())
                                        }
                                    }) {
                                        Text("Unlock")
                                            .font(.caption2)
                                            .fontWeight(.bold)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 6)
                                            .background(viewModel.mindCoins >= item.cost ? PremiumTheme.patientPrimary : Color.gray.opacity(0.3))
                                            .foregroundColor(.white)
                                            .cornerRadius(6)
                                    }
                                    .disabled(viewModel.mindCoins < item.cost)
                                }
                            }
                            .padding()
                            .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                            .cornerRadius(12)
                        }
                    }
                    
                    // Owned Skins & Themes
                    GlassmorphicCard(isLight: viewModel.theme == "light") {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Your Unlocked Collection")
                                .font(.headline)
                                .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                            
                            let unlocked = Array(viewModel.unlockedSkins)
                            if unlocked.isEmpty {
                                Text("Complete wellness tasks to earn coins and unlock custom themes.")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            } else {
                                ForEach(unlocked, id: \.self) { skin in
                                    HStack {
                                        Image(systemName: "checkmark.seal.fill")
                                            .foregroundColor(PremiumTheme.patientPrimary)
                                        Text(skin)
                                            .font(.subheadline)
                                        Spacer()
                                        
                                        if viewModel.theme == skin.lowercased() {
                                            Text("Active Selection")
                                                .font(.caption2)
                                                .foregroundColor(.gray)
                                        } else {
                                            Button("Equip Style") {
                                                viewModel.saveTheme(skin.lowercased())
                                            }
                                            .font(.caption2)
                                            .foregroundColor(PremiumTheme.patientPrimary)
                                        }
                                    }
                                    .padding(.vertical, 4)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
