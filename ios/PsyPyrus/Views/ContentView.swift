import SwiftUI

public struct ContentView: View {
    @StateObject private var viewModel = PsyPyrusViewModel()
    
    public init() {}
    
    public var body: some View {
        Group {
            if viewModel.isBiometricVerified {
                MainLayoutView(viewModel: viewModel)
            } else {
                BiometricLockView(viewModel: viewModel)
            }
        }
        .preferredColorScheme(viewModel.theme == "light" ? .light : .dark)
    }
}
