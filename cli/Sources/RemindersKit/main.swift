import EventKit
import Foundation

// MARK: - Error types

enum CLIError: Error {
    case missingArgument(String)
    case unknownCommand(String)
    case listNotFound(String)
    case taskNotFound(String)
    case permissionDenied
    case custom(String)
}

extension CLIError: LocalizedError {
    var errorDescription: String? {
        switch self {
        case .missingArgument(let arg): return "Argomento mancante: \(arg)"
        case .unknownCommand(let cmd): return "Comando sconosciuto: \(cmd)"
        case .listNotFound(let name): return "Lista non trovata: \(name)"
        case .taskNotFound(let id): return "Task non trovato: \(id)"
        case .permissionDenied: return "Accesso a Reminders negato. Controlla Preferenze di Sistema > Privacy > Promemoria."
        case .custom(let msg): return msg
        }
    }
}

// MARK: - Argument parser helpers

func arg(after flag: String, in args: [String]) -> String? {
    guard let idx = args.firstIndex(of: flag), idx + 1 < args.count else { return nil }
    return args[idx + 1]
}

func flag(_ name: String, in args: [String]) -> Bool? {
    guard let idx = args.firstIndex(of: name), idx + 1 < args.count else { return nil }
    let val = args[idx + 1].lowercased()
    return val == "true" || val == "1" || val == "yes"
}

// MARK: - Permission request

func requestAccess(store: EKEventStore) {
    let semaphore = DispatchSemaphore(value: 0)
    if #available(macOS 14.0, *) {
        store.requestFullAccessToReminders { _, _ in semaphore.signal() }
    } else {
        store.requestAccess(to: .reminder) { _, _ in semaphore.signal() }
    }
    semaphore.wait()
}

// MARK: - Main

func run() {
    let args = Array(CommandLine.arguments.dropFirst())

    guard let command = args.first else {
        fputs("Uso: reminders-kit <comando> [opzioni]\n", stderr)
        fputs("Comandi: list-lists, list-tasks, get-task, create-task, update-task, create-subtask, update-subtask, move-task\n", stderr)
        exit(1)
    }

    let store = EKEventStore()
    requestAccess(store: store)

    // Check authorization
    let status = EKEventStore.authorizationStatus(for: .reminder)
    var authorized = false
    if #available(macOS 14.0, *) {
        authorized = (status == .fullAccess)
    } else {
        authorized = (status == .authorized)
    }
    guard authorized else {
        fputs(CLIError.permissionDenied.errorDescription!, stderr)
        exit(1)
    }

    do {
        switch command {
        case "list-lists":
            try listLists(store: store)

        case "list-tasks":
            guard let listName = arg(after: "--list", in: args) else {
                throw CLIError.missingArgument("--list")
            }
            try listTasks(store: store, listName: listName)

        case "get-task":
            guard let id = arg(after: "--id", in: args) else {
                throw CLIError.missingArgument("--id")
            }
            try getTask(store: store, id: id)

        case "create-task":
            guard let listName = arg(after: "--list", in: args) else {
                throw CLIError.missingArgument("--list")
            }
            guard let title = arg(after: "--title", in: args) else {
                throw CLIError.missingArgument("--title")
            }
            let note = arg(after: "--note", in: args)
            let due = arg(after: "--due", in: args)
            let section = arg(after: "--section", in: args)
            try createTask(store: store, listName: listName, title: title, note: note, due: due, section: section)

        case "update-task":
            guard let id = arg(after: "--id", in: args) else {
                throw CLIError.missingArgument("--id")
            }
            let title = arg(after: "--title", in: args)
            let completed = flag("--completed", in: args)
            let due = arg(after: "--due", in: args)
            let note = arg(after: "--note", in: args)
            try updateTask(store: store, id: id, title: title, completed: completed, due: due, note: note)

        case "create-subtask":
            guard let parentId = arg(after: "--parent", in: args) else {
                throw CLIError.missingArgument("--parent")
            }
            guard let title = arg(after: "--title", in: args) else {
                throw CLIError.missingArgument("--title")
            }
            let due = arg(after: "--due", in: args)
            try createSubtask(store: store, parentId: parentId, title: title, due: due)

        case "update-subtask":
            guard let id = arg(after: "--id", in: args) else {
                throw CLIError.missingArgument("--id")
            }
            let title = arg(after: "--title", in: args)
            let completed = flag("--completed", in: args)
            let due = arg(after: "--due", in: args)
            try updateSubtask(store: store, id: id, title: title, completed: completed, due: due)

        case "move-task":
            guard let id = arg(after: "--id", in: args) else {
                throw CLIError.missingArgument("--id")
            }
            guard let section = arg(after: "--section", in: args) else {
                throw CLIError.missingArgument("--section")
            }
            try moveTask(store: store, id: id, section: section)

        default:
            throw CLIError.unknownCommand(command)
        }
    } catch {
        fputs("ERRORE: \(error.localizedDescription)\n", stderr)
        exit(1)
    }
}

run()
