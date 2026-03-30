import Foundation

struct ReminderItem: Codable {
    let id: String
    let title: String
    let notes: String?
    let isCompleted: Bool
    let dueDate: String?
    let section: String?
    let list: String
    let priority: Int
    let subtasks: [SubtaskItem]
}
