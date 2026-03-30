import EventKit
import Foundation

func listTasks(store: EKEventStore, listName: String) throws {
    guard let calendar = store.calendars(for: .reminder).first(where: { $0.title == listName }) else {
        throw CLIError.listNotFound(listName)
    }

    let predicate = store.predicateForReminders(in: [calendar])
    var reminders: [EKReminder] = []
    let semaphore = DispatchSemaphore(value: 0)

    store.fetchReminders(matching: predicate) { fetched in
        reminders = fetched ?? []
        semaphore.signal()
    }
    semaphore.wait()

    // Separate parent tasks from subtasks
    let subtaskReminders = reminders.filter { isSubtask($0) }
    let parentReminders = reminders.filter { !isSubtask($0) && !$0.isCompleted }

    var items: [ReminderItem] = []
    for reminder in parentReminders {
        let parentId = reminder.calendarItemExternalIdentifier
        let subtasks = subtaskReminders
            .filter { getParentId($0) == parentId }
            .map { SubtaskItem(
                id: $0.calendarItemExternalIdentifier,
                title: $0.title ?? "",
                isCompleted: $0.isCompleted,
                dueDate: $0.dueDateComponents?.date.map { isoString($0) }
            )}
        let section = extractSection(from: reminder.notes)
        let cleanNotes = cleanedNotes(reminder.notes)
        let item = ReminderItem(
            id: reminder.calendarItemExternalIdentifier,
            title: reminder.title ?? "",
            notes: cleanNotes.isEmpty ? nil : cleanNotes,
            isCompleted: reminder.isCompleted,
            dueDate: reminder.dueDateComponents?.date.map { isoString($0) },
            section: section,
            list: listName,
            priority: reminder.priority,
            subtasks: subtasks
        )
        items.append(item)
    }

    let encoder = JSONEncoder()
    encoder.outputFormatting = .prettyPrinted
    let data = try encoder.encode(items)
    print(String(data: data, encoding: .utf8)!)
}

func isSubtask(_ reminder: EKReminder) -> Bool {
    guard let notes = reminder.notes else { return false }
    return notes.contains("__parent:")
}

func getParentId(_ reminder: EKReminder) -> String? {
    guard let notes = reminder.notes else { return nil }
    for line in notes.components(separatedBy: "\n") {
        if line.hasPrefix("__parent:") {
            return String(line.dropFirst("__parent:".count))
        }
    }
    return nil
}

func extractSection(from notes: String?) -> String? {
    guard let notes = notes else { return nil }
    for line in notes.components(separatedBy: "\n") {
        if line.hasPrefix("__section:") {
            return String(line.dropFirst("__section:".count))
        }
    }
    return nil
}

func cleanedNotes(_ notes: String?) -> String {
    guard let notes = notes else { return "" }
    let lines = notes.components(separatedBy: "\n").filter {
        !$0.hasPrefix("__section:") && !$0.hasPrefix("__parent:")
    }
    return lines.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
}

func makeReminderItem(reminder: EKReminder, listName: String, subtasks: [SubtaskItem]) -> ReminderItem {
    let section = extractSection(from: reminder.notes)
    let cleanNotes = cleanedNotes(reminder.notes)
    return ReminderItem(
        id: reminder.calendarItemExternalIdentifier,
        title: reminder.title ?? "",
        notes: cleanNotes.isEmpty ? nil : cleanNotes,
        isCompleted: reminder.isCompleted,
        dueDate: reminder.dueDateComponents?.date.map { isoString($0) },
        section: section,
        list: listName,
        priority: reminder.priority,
        subtasks: subtasks
    )
}

func isoString(_ date: Date) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime]
    return formatter.string(from: date)
}
