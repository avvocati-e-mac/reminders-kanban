import EventKit
import Foundation

func createSubtask(store: EKEventStore, parentId: String, title: String, due: String?) throws {
    let allCalendars = store.calendars(for: .reminder)
    let predicate = store.predicateForReminders(in: allCalendars)
    var reminders: [EKReminder] = []
    let semaphore = DispatchSemaphore(value: 0)

    store.fetchReminders(matching: predicate) { fetched in
        reminders = fetched ?? []
        semaphore.signal()
    }
    semaphore.wait()

    guard let parent = reminders.first(where: { $0.calendarItemExternalIdentifier == parentId }) else {
        throw CLIError.taskNotFound(parentId)
    }

    let subtask = EKReminder(eventStore: store)
    subtask.title = title
    subtask.calendar = parent.calendar
    // Store parent reference in notes with a known prefix for retrieval
    subtask.notes = "__parent:\(parentId)"

    if let due = due, let date = parseISO(due) {
        subtask.dueDateComponents = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute, .second], from: date)
    }

    try store.save(subtask, commit: true)

    let item = SubtaskItem(
        id: subtask.calendarItemExternalIdentifier,
        title: subtask.title ?? "",
        isCompleted: subtask.isCompleted,
        dueDate: subtask.dueDateComponents?.date.map { isoString($0) }
    )
    let encoder = JSONEncoder()
    encoder.outputFormatting = .prettyPrinted
    let data = try encoder.encode(item)
    print(String(data: data, encoding: .utf8)!)
}
