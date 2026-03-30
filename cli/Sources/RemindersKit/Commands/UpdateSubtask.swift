import EventKit
import Foundation

func updateSubtask(store: EKEventStore, id: String, title: String?, completed: Bool?, due: String?) throws {
    let allCalendars = store.calendars(for: .reminder)
    let predicate = store.predicateForReminders(in: allCalendars)
    var reminders: [EKReminder] = []
    let semaphore = DispatchSemaphore(value: 0)

    store.fetchReminders(matching: predicate) { fetched in
        reminders = fetched ?? []
        semaphore.signal()
    }
    semaphore.wait()

    guard let reminder = reminders.first(where: { $0.calendarItemExternalIdentifier == id }) else {
        throw CLIError.taskNotFound(id)
    }

    if let title = title { reminder.title = title }
    if let completed = completed { reminder.isCompleted = completed }
    if let due = due {
        if due == "null" {
            reminder.dueDateComponents = nil
        } else if let date = parseISO(due) {
            reminder.dueDateComponents = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
        }
    }

    try store.save(reminder, commit: true)

    let item = SubtaskItem(
        id: reminder.calendarItemExternalIdentifier,
        title: reminder.title ?? "",
        isCompleted: reminder.isCompleted,
        dueDate: reminder.dueDateComponents?.date.map { isoString($0) }
    )
    let encoder = JSONEncoder()
    encoder.outputFormatting = .prettyPrinted
    let data = try encoder.encode(item)
    print(String(data: data, encoding: .utf8)!)
}
