//
//  ProjectViewController.swift
//  Ember Hearth
//
//  Created by Thomas Sunde Nielsen on 29.03.15.
//  Copyright (c) 2015 Thomas Sunde Nielsen. All rights reserved.
//

import Cocoa

class ProjectViewController: NSViewController {
    @IBOutlet var runButton: NSButton!
    @IBOutlet var openInBrowserButton: NSButton!
    @IBOutlet var titleLabel: NSTextField!
    @IBOutlet var progressIndicator: NSProgressIndicator!
    
    let runServerString = "Run Ember server"
    let stopServerString = "Stop Ember server"
    
    var project: Project? {
        get {
            var appDelegate = NSApplication.sharedApplication().delegate as! AppDelegate
            return appDelegate.activeProject
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        NSNotificationCenter.defaultCenter().addObserver(self, selector: "projectChanged:", name: "activeProjectSet", object: nil)
        NSNotificationCenter.defaultCenter().addObserver(self, selector: "serverStarting", name: "serverStarting", object: nil)
        NSNotificationCenter.defaultCenter().addObserver(self, selector: "serverStarted", name: "serverStarted", object: nil)
        NSNotificationCenter.defaultCenter().addObserver(self, selector: "serverStopped", name: "serverStopped", object: nil)
        NSNotificationCenter.defaultCenter().addObserver(self, selector: "serverStopped", name: "serverStoppedWithError", object: nil)
        if project != nil {
            self.projectChanged(nil)
        }
    }
    
    @IBAction func toggleServer(sender: AnyObject?) {
        ProjectController.sharedInstance.toggleServer(sender)
    }
    
    @IBAction func openInBrowser (sender: AnyObject) {
        if let defaultBrowser = NSUserDefaults.standardUserDefaults().objectForKey(defaultBrowserKey) as? String {
            let urls = [NSURL(string: "http://localhost:4200")!] as [AnyObject]
            NSWorkspace.sharedWorkspace().openURLs(urls, withAppBundleIdentifier: defaultBrowser, options: NSWorkspaceLaunchOptions.allZeros, additionalEventParamDescriptor: nil, launchIdentifiers: nil)
        } else {
            NSWorkspace.sharedWorkspace().openURL(NSURL(string: "http://localhost:4200")!)
        }
    }
    
    func serverStarting() {
        progressIndicator.startAnimation(self)
        progressIndicator.hidden = false
        runButton.title = stopServerString
    }
    
    func serverStarted() {
        runButton.title = stopServerString
        openInBrowserButton.hidden = false
        progressIndicator.hidden = true
        progressIndicator.stopAnimation(self)
    }
    
    func serverStopped() {
        openInBrowserButton.hidden = true
        runButton.title = runServerString
        progressIndicator.hidden = true
        progressIndicator.stopAnimation(self)
    }

    func projectChanged(notification: NSNotification?) {
        setProjectTitle(notification)
        if project != nil && project!.serverStatus == .running {
            runButton.title = stopServerString
        } else {
            runButton.title = runServerString
        }
    }
    
    func setProjectTitle(notification: NSNotification?) {
        if let name = project?.name {
            self.titleLabel.stringValue = name
        }
        
        NSApplication.sharedApplication().mainWindow?.makeFirstResponder(self.view)
    }
    
    deinit {
        NSNotificationCenter.defaultCenter().removeObserver(self)
    }
}
