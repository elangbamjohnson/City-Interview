//
//  City_InterviewApp.swift
//  City-Interview
//
//  Created by Johnson Elangbam on 22/07/26.
//

import SwiftUI

@main
struct City_InterviewApp: App {
    @StateObject private var store = QuestionStore()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}
