import EventKit
import Foundation

func moveTask(store: EKEventStore, id: String, section: String) throws {
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

    // Find the target calendar (list) matching the section name
    // In Apple Reminders, "sections" within a list are EKCalendar sections (EKRemindersSection).
    // On macOS, the EKReminder.calendar property maps to the Reminders list.
    // "Sections" within a list (smart groups/sections introduced in Reminders for macOS 13)
    // are not directly exposed via EventKit — they are a UI concept only.
    // The practical workaround: store section name in notes with prefix "__section:<name>"
    // so the server can filter tasks by section from the notes field.

    // Update section marker in notes
    let existingNotes = reminder.notes ?? ""
    // Remove existing section marker if present
    let lines = existingNotes.components(separatedBy: "\n").filter { !$0.hasPrefix("__section:") }
    var newLines = lines
    newLines.append("__section:\(section)")
    reminder.notes = newLines.joined(separator: "\n")

    try store.save(reminder, commit: true)

    let listName = reminder.calendar?.title ?? ""
    let item = makeReminderItem(reminder: reminder, listName: listName, subtasks: [])
    let encoder = JSONEncoder()
    encoder.outputFormatting = .prettyPrinted
    let data = try encoder.encode(item)
    print(String(data: data, encoding: .utf8)!)
}
