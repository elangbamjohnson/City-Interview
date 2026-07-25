//
//  ContentView.swift
//  City-Interview
//
//  Created by Johnson Elangbam on 22/07/26.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            CategoryListView()
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(QuestionStore())
}
