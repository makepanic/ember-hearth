//
//  DependencyManager.swift
//  Ember Hearth
//
//  Created by Thomas Sunde Nielsen on 30.03.15.
//  Copyright (c) 2015 Thomas Sunde Nielsen. All rights reserved.
//

import Cocoa

protocol CLITool {
    func install(completion:(success:Bool) -> ())
    func installIfNeeded(completion:(success:Bool) -> ())
}

enum Dependency: String {
    case Node = "Node.js"
    case NPM = "NPM"
    case Bower = "Bower"
    case PhantomJS = "Phantom.js"
    case Ember = "Ember-CLI"
}

class DependencyManager {
    var progressBar: ProgressWindowController?
    
    func listNeededInstalls () -> ([String], [Dependency]) {
        var needed: [String] = []
        var dependencies: [Dependency] = []
        switch Node.isInstalled() {
        case true: needed.append("✅ Node.js")
        default:
            needed.append("❌ Node.js")
            dependencies.append(.Node)
        }
        
        switch NPM.isInstalled() {
        case true: needed.append("✅ NPM")
        default:
            needed.append("❌ NPM")
            dependencies.append(.NPM)
        }
        
        switch Bower.isInstalled() {
        case true: needed.append("✅ Bower")
        default:
            needed.append("❌ Bower")
            dependencies.append(.Bower)
        }
        
        switch PhantomJS.isInstalled() {
        case true: needed.append("✅ PhantomJS")
        default:
            needed.append("❌ PhantomJS")
            dependencies.append(.PhantomJS)
        }
        
        switch EmberCLI.isInstalled() {
        case true: needed.append("✅ Ember-CLI")
        default:
            needed.append("❌ Ember-CLI")
            dependencies.append(.Ember)
        }
        return (needed, dependencies)
    }
    
    func showDependencyStatus() {
        let (needed, dependencies) = listNeededInstalls()
        var neededString = ""
        for string in needed {
            neededString += "\(string)\n"
        }
        if dependencies.count == 1 {
            neededString += "\n\(dependencies.count) dependency missing."
        } else if dependencies.count > 0 {
            neededString += "\n\(dependencies.count) dependencies missing."
        } else {
            neededString += "\nAll dependencies installed."
        }
        
        var alert = NSAlert()
        alert.messageText = "Dependencies:"
        alert.informativeText = neededString
        alert.addButtonWithTitle("OK")
        alert.beginSheetModalForWindow(NSApplication.sharedApplication().mainWindow!, completionHandler: nil)
    }
    
    func installDependencies(completion:(success:Bool) -> ()) {
        let (needed, dependencies) = listNeededInstalls()
        var neededString = ""
        for string in needed {
            neededString += "\(string)\n"
        }
        if dependencies.count == 1 {
            neededString += "\nEmber Hearth will install \(dependencies[0].rawValue) automatically."
        } else if dependencies.count > 0 {
            neededString += "\nEmber Hearth will install \(dependencies.count) missing dependencies automatically."
        } else {
            completion(success: true)
            return
        }

        var alert = NSAlert()
        alert.messageText = "Dependencies:"
        alert.informativeText = neededString
        alert.addButtonWithTitle("OK")
        alert.addButtonWithTitle("Cancel")
        alert.beginSheetModalForWindow(NSApplication.sharedApplication().mainWindow!, completionHandler: { (response: NSModalResponse) -> Void in
            if response == 1000 { // OK
                self.installDependeniesInOrder(dependencies, totalCount: dependencies.count, completion: completion)
            }
        })
    }
    
    private func installDependeniesInOrder(dependencies: [Dependency], totalCount: Int, completion:(success:Bool) -> ()) {
        if self.progressBar == nil {
            self.progressBar = ProgressWindowController()
            NSBundle.mainBundle().loadNibNamed("ProgressPanel", owner: self.progressBar, topLevelObjects: nil)
        }
        
        let dependency = dependencies[0]
        var tool = initializedToolForDependency(dependency)

        dispatch_async(dispatch_get_main_queue(), { () -> Void in
            self.progressBar?.label.stringValue = "Installing \(dependency.rawValue)…"
            if dependency == Dependency.Node {
                self.progressBar?.label.stringValue += " This may take up to 15 minutes."
            }
            println("\(self.progressBar?.label.stringValue)")
            if self.progressBar?.window?.sheetParent == nil {
                NSApplication.sharedApplication().mainWindow?.beginSheet(self.progressBar!.window!, completionHandler: nil)
            }
        })
        
        tool.installIfNeeded { (success) -> () in
            var reducedArray = Array<Dependency>(dependencies)
            reducedArray.removeAtIndex(0)
            println("Installed \(dependency.rawValue), \(reducedArray.count) dependencies left")
            if success && reducedArray.count > 0 {
                println("Proceeding to next dependency")
                self.progressBar?.progressIndicator.doubleValue = Double(totalCount - reducedArray.count) / Double(totalCount)
                self.installDependeniesInOrder(reducedArray, totalCount: totalCount, completion: completion)
            } else {
                println("Done installing dependencies with success? \(success) still missing: \(reducedArray.count)")
                if let progressBar = self.progressBar {
                    if success {
                        progressBar.progressIndicator.doubleValue = 1
                        progressBar.label.stringValue = "Success!"
                    } else {
                        progressBar.label.stringValue = "Error installing \(dependency.rawValue). Aborting."
                    }
                    let delayTime = dispatch_time(DISPATCH_TIME_NOW,
                        Int64(0.5 * Double(NSEC_PER_SEC)))
                    dispatch_after(delayTime, dispatch_get_main_queue()) {
                        progressBar.window!.orderOut(nil)
                        progressBar.window!.endSheet(progressBar.window!)
                        self.progressBar = nil
                        completion(success: success)
                    }
                } else {
                    completion(success: success)
                }
            }
        }
    }
    
    func initializedToolForDependency(dependency: Dependency) -> CLITool {
        switch dependency {
        case .Node:
            return Node()
        case .NPM:
            return NPM()
        case .Bower:
            return Bower()
        case .Ember:
            return EmberCLI()
        case .PhantomJS:
            return PhantomJS()
        }
    }
}