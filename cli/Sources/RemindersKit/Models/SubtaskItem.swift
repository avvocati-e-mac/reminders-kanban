import Foundation

struct SubtaskItem: Codable {
    let id: String
    let title: String
    let isCompleted: Bool
    let dueDate: String?
}
