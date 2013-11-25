//
//  main.m
//  RNAO-iPad
//
//  Created by Michael Brooks on 11-01-11.
//  Copyright __MyCompanyName__ 2011. All rights reserved.
//

#import <UIKit/UIKit.h>

int main(int argc, char *argv[]) {
    
    NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];
    int retVal = UIApplicationMain(argc, argv, nil, @"RNAO_iPadAppDelegate");
    [pool release];
    return retVal;
}
