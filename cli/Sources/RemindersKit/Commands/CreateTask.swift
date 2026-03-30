import EventKit
import Foundation

func createTask(store: EKEventStore, listName: String, title: String, note: String?, due: String?, section: String?) throws {
    guard let calendar = store.calendars(for: .reminder).first(where: { $0.title == listName }) else {
        throw CLIError.listNotFound(listName)
    }

    let reminder = EKReminder(eventStore: store)
    reminder.title = title
    reminder.calendar = calendar
    reminder.notes = note

    if let due = due, let date = parseISO(due) {
        let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
        reminder.dueDateComponents = components
    }

    try store.save(reminder, commit: true)

    let item = makeReminderItem(reminder: reminder, listName: listName, subtasks: [])
    let encoder = JSONEncoder()
    encoder.outputFormatting = .prettyPrinted
    let data = try encoder.encode(item)
    print(String(data: data, encoding: .utf8)!)
}

func parseISO(_ string: String) -> Date? {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let date = formatter.date(from: string) { return date }
    formatter.formatOptions = [.withInternetDateTime]
    return formatter.date(from: string)
}
