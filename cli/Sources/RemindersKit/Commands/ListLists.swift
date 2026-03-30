import EventKit
import Foundation

func listLists(store: EKEventStore) throws {
    let calendars = store.calendars(for: .reminder)
    let result = calendars.map { ["id": $0.calendarIdentifier, "title": $0.title] }
    let data = try JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted])
    print(String(data: data, encoding: .utf8)!)
}
