import EventKit
import Foundation

func getTask(store: EKEventStore, id: String) throws {
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

    let listName = reminder.calendar?.title ?? ""
    let item = makeReminderItem(reminder: reminder, listName: listName, subtasks: [])
    let encoder = JSONEncoder()
    encoder.outputFormatting = .prettyPrinted
    let data = try encoder.encode(item)
    print(String(data: data, encoding: .utf8)!)
}
