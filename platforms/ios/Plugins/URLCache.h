//
//  UrlCache.h
//  DeviceReadyTest
//
//  Created by Jesse MacFadyen on 09-12-01.
//  Copyright 2009 Nitobi. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "PhoneGapCommand.h"
#import	"URLCacheConnection.h"


@interface URLCache : PhoneGapCommand < URLCacheConnectionDelegate > {
	NSString *dataPath;
	NSString *filePath;
	NSString *urlToCache;
	NSDate *fileDate;
	NSMutableArray *urlArray;
	NSError *error;

}

@property (nonatomic, copy) NSString *dataPath;
@property (nonatomic, copy) NSString *filePath;
@property (nonatomic, copy) NSString *urlToCache;
@property (nonatomic, retain) NSDate *fileDate;
@property (nonatomic, retain) NSMutableArray *urlArray;


- (void) getCachedPathforURI:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

- (void) removeCachedResourceByURI:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;


@end
