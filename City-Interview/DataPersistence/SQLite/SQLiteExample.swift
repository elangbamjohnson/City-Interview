import Foundation
import SQLite3

// MARK: - ⚙️ SQLite Internals (Raw C API)
//
// 💡 INTERVIEW TALKING POINTS:
// • Why choose raw SQLite over Core Data? Unmatched performance for bulk operations, thread-safety controls, cross-platform code (C/C++), and full, raw SQL query control.
// • Prepared Statements: Pre-compiled SQL statements (`sqlite3_prepare_v2`) that execute faster and protect against SQL Injection attacks.
// • Row ID: SQLite automatically assigns a hidden, highly optimized auto-incrementing integer (`rowid`) to every row, which makes primary key lookups incredibly fast.

// ==========================================
// CRUD Flow Example (Raw SQLite3)
// ==========================================

class SQLiteDemonstrator {
    var db: OpaquePointer?
    
    init() {
        // 1. Open Connection
        let fileURL = try! FileManager.default
            .url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: false)
            .appendingPathComponent("NotesDatabase.sqlite")
        
        if sqlite3_open(fileURL.path, &db) != SQLITE_OK {
            print("Error opening database")
        }
        
        // 2. Create Table
        let createTableString = "CREATE TABLE IF NOT EXISTS Notes (Id TEXT PRIMARY KEY, Title TEXT, Timestamp REAL);"
        var createTableStatement: OpaquePointer?
        
        if sqlite3_prepare_v2(db, createTableString, -1, &createTableStatement, nil) == SQLITE_OK {
            sqlite3_step(createTableStatement)
        }
        sqlite3_finalize(createTableStatement)
    }
    
    // Create
    func createNote(id: String, title: String) {
        let insertString = "INSERT INTO Notes (Id, Title, Timestamp) VALUES (?, ?, ?);"
        var insertStatement: OpaquePointer?
        
        if sqlite3_prepare_v2(db, insertString, -1, &insertStatement, nil) == SQLITE_OK {
            // Bind parameters (Prepared Statement)
            sqlite3_bind_text(insertStatement, 1, (id as NSString).utf8String, -1, nil)
            sqlite3_bind_text(insertStatement, 2, (title as NSString).utf8String, -1, nil)
            sqlite3_bind_double(insertStatement, 3, Date().timeIntervalSince1970)
            
            sqlite3_step(insertStatement)
        }
        sqlite3_finalize(insertStatement)
    }
    
    // Read
    func fetchNotes() {
        let queryString = "SELECT Id, Title FROM Notes;"
        var queryStatement: OpaquePointer?
        
        if sqlite3_prepare_v2(db, queryString, -1, &queryStatement, nil) == SQLITE_OK {
            while sqlite3_step(queryStatement) == SQLITE_ROW {
                let id = String(cString: sqlite3_column_text(queryStatement, 0))
                let title = String(cString: sqlite3_column_text(queryStatement, 1))
                print("Found Note: \(id) - \(title)")
            }
        }
        sqlite3_finalize(queryStatement)
    }
    
    // Update
    func updateNote(id: String, newTitle: String) {
        let updateString = "UPDATE Notes SET Title = ? WHERE Id = ?;"
        var updateStatement: OpaquePointer?
        
        if sqlite3_prepare_v2(db, updateString, -1, &updateStatement, nil) == SQLITE_OK {
            sqlite3_bind_text(updateStatement, 1, (newTitle as NSString).utf8String, -1, nil)
            sqlite3_bind_text(updateStatement, 2, (id as NSString).utf8String, -1, nil)
            sqlite3_step(updateStatement)
        }
        sqlite3_finalize(updateStatement)
    }
    
    // Delete
    func deleteNote(id: String) {
        let deleteString = "DELETE FROM Notes WHERE Id = ?;"
        var deleteStatement: OpaquePointer?
        
        if sqlite3_prepare_v2(db, deleteString, -1, &deleteStatement, nil) == SQLITE_OK {
            sqlite3_bind_text(deleteStatement, 1, (id as NSString).utf8String, -1, nil)
            sqlite3_step(deleteStatement)
        }
        sqlite3_finalize(deleteStatement)
    }
}

// ==========================================
// 🎙️ Interview Q&A
// ==========================================
// • Q: Why use prepared statements?
//   A: They prevent SQL injection (by separating code from data) and are much faster when executed multiple times because the SQL is pre-compiled.
// • Q: Is SQLite thread-safe?
//   A: Yes, if configured correctly (Serialized mode). However, passing open SQLite handles across threads without locks can still cause issues depending on how you compiled it.
// • Q: What is the main downside of raw SQLite in Swift?
//   A: You have to deal with C-pointers (`OpaquePointer`), manual memory management (`sqlite3_finalize`), and write boilerplate SQL queries.
