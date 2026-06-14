import SwiftUI

public struct PeerSupportView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    @State private var newPostText = ""
    @State private var isAnonymous = true
    @State private var posts = [
        PeerPost(id: 1, author: "Anonymous Patient", content: "Lately I have been practicing the 4-7-8 breathing technique from the Wellness Lounge, and it really helped calm my panic spikes during work meetings.", likes: 8, comments: 2, date: "Today"),
        PeerPost(id: 2, author: "HopefulPathfinder", content: "Struggling with sleep latency this week. Does anyone have routines they follow to power down laptops by 8 PM?", likes: 4, comments: 5, date: "Yesterday"),
        PeerPost(id: 3, author: "VagalToneWarrior", content: "Highly recommend Dr. Sarah's cognitive restructuring guides. Setting small boundaries makes a massive difference.", likes: 12, comments: 1, date: "3 days ago")
    ]
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Header
            HStack {
                Image(systemName: "groups")
                    .foregroundColor(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                    .font(.title2)
                Text("Peer Support Network")
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            // Subtitle
            Text("Secure, anonymous peer grounding shares. All messages comply with local encryption guidelines.")
                .font(.caption)
                .foregroundColor(.gray)
            
            // New Post input (Patient only)
            if viewModel.activeRole == "Patient" {
                VStack(spacing: 12) {
                    TextEditor(text: $newPostText)
                        .frame(height: 80)
                        .padding(8)
                        .background(viewModel.theme == "light" ? Color.gray.opacity(0.1) : Color.white.opacity(0.05))
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                    
                    HStack {
                        Toggle("Post Anonymously", isOn: $isAnonymous)
                            .font(.caption)
                            .toggleStyle(SwitchToggleStyle(tint: PremiumTheme.patientPrimary))
                        
                        Spacer()
                        
                        Button(action: submitPost) {
                            Text("Share Post")
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(PremiumTheme.patientPrimary)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                        .disabled(newPostText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                }
                .padding()
                .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                .cornerRadius(12)
            }
            
            // Feed list
            VStack(spacing: 12) {
                ForEach(posts) { post in
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Image(systemName: "person.circle.fill")
                                .foregroundColor(.teal)
                            Text(post.author)
                                .font(.footnote)
                                .fontWeight(.bold)
                            Spacer()
                            Text(post.date)
                                .font(.caption2)
                                .foregroundColor(.gray)
                        }
                        
                        Text(post.content)
                            .font(.body)
                            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
                        
                        HStack(spacing: 16) {
                            Button(action: {
                                if let idx = posts.firstIndex(where: { $0.id == post.id }) {
                                    posts[idx].likes += 1
                                }
                            }) {
                                HStack(spacing: 4) {
                                    Image(systemName: "heart.fill")
                                        .foregroundColor(.red)
                                    Text("\(post.likes)")
                                }
                            }
                            
                            HStack(spacing: 4) {
                                Image(systemName: "bubble.right.fill")
                                    .foregroundColor(.gray)
                                Text("\(post.comments) comments")
                            }
                            
                            Spacer()
                        }
                        .font(.caption)
                    }
                    .padding()
                    .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                    .cornerRadius(12)
                }
            }
        }
    }
    
    private func submitPost() {
        let text = newPostText.trimmingCharacters(in: .whitespacesAndNewlines)
        if !text.isEmpty {
            let newPost = PeerPost(
                id: posts.count + 1,
                author: isAnonymous ? "Anonymous Patient" : "Alex Rivera",
                content: text,
                likes: 0,
                comments: 0,
                date: "Just now"
            )
            posts.insert(newPost, at: 0)
            newPostText = ""
        }
    }
}

struct PeerPost: Identifiable {
    let id: Int
    let author: String
    let content: String
    var likes: Int
    let comments: Int
    let date: String
}
