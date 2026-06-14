import SwiftUI

public struct HomeworkTrackerView: View {
    @ObservedObject var viewModel: PsyPyrusViewModel
    @State private var newTaskDesc = ""
    
    public init(viewModel: PsyPyrusViewModel) {
        self.viewModel = viewModel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Header
            HStack {
                Image(systemName: "clipboard.fill")
                    .foregroundColor(viewModel.activeRole == "Professional" ? PremiumTheme.clinicianPrimary : PremiumTheme.patientPrimary)
                    .font(.title2)
                Text("Care Board & Homework")
                    .font(.title3)
                    .fontWeight(.bold)
                Spacer()
            }
            .foregroundColor(viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark)
            
            Text("Assign and track clinical exercises, somatic goals, and mindfulness drills.")
                .font(.caption)
                .foregroundColor(.gray)
            
            // Assign new task (Professional only)
            if viewModel.activeRole == "Professional" {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Assign a New Task:")
                        .font(.footnote)
                        .fontWeight(.bold)
                    
                    HStack {
                        TextField("e.g. Turn off work laptop by 8 PM daily", text: $newTaskDesc)
                            .padding(10)
                            .background(viewModel.theme == "light" ? Color.gray.opacity(0.1) : Color.white.opacity(0.05))
                            .cornerRadius(8)
                        
                        Button(action: assignTask) {
                            Text("Assign")
                                .font(.caption)
                                .fontWeight(.bold)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(PremiumTheme.clinicianPrimary)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                        .disabled(newTaskDesc.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                }
                .padding()
                .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                .cornerRadius(12)
            }
            
            // Task list
            VStack(spacing: 12) {
                let list = viewModel.homeworkTasks.filter { $0.patientId == viewModel.selectedPatientId }
                if list.isEmpty {
                    Text("No active tasks or homework assigned for this patient.")
                        .font(.footnote)
                        .foregroundColor(.gray)
                        .padding()
                } else {
                    ForEach(list) { task in
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(task.description)
                                    .fontWeight(.bold)
                                    .strikethrough(task.isCompleted)
                                    .foregroundColor(task.isCompleted ? .gray : (viewModel.theme == "light" ? PremiumTheme.textPrimaryLight : PremiumTheme.textPrimaryDark))
                                
                                Text(task.isCompleted ? "Completed" : "Assigned")
                                    .font(.caption2)
                                    .foregroundColor(task.isCompleted ? PremiumTheme.success : .amber)
                            }
                            
                            Spacer()
                            
                            if viewModel.activeRole == "Patient" {
                                Button(action: { toggleTask(task) }) {
                                    Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                                        .foregroundColor(task.isCompleted ? PremiumTheme.success : .gray)
                                        .font(.title3)
                                }
                            } else {
                                // Professional view shows delete button
                                Button(action: { deleteTask(task) }) {
                                    Image(systemName: "trash.fill")
                                        .foregroundColor(PremiumTheme.error)
                                }
                            }
                        }
                        .padding()
                        .background(viewModel.theme == "light" ? Color.white : PremiumTheme.cardDark)
                        .cornerRadius(12)
                    }
                }
            }
        }
    }
    
    private func assignTask() {
        let text = newTaskDesc.trimmingCharacters(in: .whitespacesAndNewlines)
        if !text.isEmpty {
            let nextId = Int64(viewModel.homeworkTasks.count + 1)
            let newTask = HomeworkTask(
                id: nextId,
                patientId: viewModel.selectedPatientId,
                description: text,
                isCompleted: false,
                assignedDate: Date()
            )
            viewModel.homeworkTasks.insert(newTask, at: 0)
            newTaskDesc = ""
            viewModel.logAudit(action: "Homework Assigned", details: "Assigned care task: \(text)")
        }
    }
    
    private func toggleTask(_ task: HomeworkTask) {
        if let idx = viewModel.homeworkTasks.firstIndex(where: { $0.id == task.id }) {
            viewModel.homeworkTasks[idx].isCompleted.toggle()
            viewModel.logAudit(action: "Homework Updated", details: "Task status changed: \(task.description)")
        }
    }
    
    private func deleteTask(_ task: HomeworkTask) {
        if let idx = viewModel.homeworkTasks.firstIndex(where: { $0.id == task.id }) {
            viewModel.homeworkTasks.remove(at: idx)
            viewModel.logAudit(action: "Homework Removed", details: "Deleted task: \(task.description)")
        }
    }
}
