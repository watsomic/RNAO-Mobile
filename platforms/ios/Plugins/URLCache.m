//
//  UrlCache.m
//  DeviceReadyTest
//
//  Created by Jesse MacFadyen on 09-12-01.
//  Copyright 2009 Nitobi. All rights reserved.
//

#import "URLCache.h"

/* cache update interval in seconds */
const double URLCacheInterval = ( 60 * 60 * 24.0 );


@interface NSObject (PrivateMethods)

- (void) getFileModificationDate;
- (void) initCache;
- (void) initPaths;
- (void) clearCache;

@end

@implementation URLCache

@synthesize dataPath;
@synthesize filePath;
@synthesize fileDate;
@synthesize urlArray;
@synthesize urlToCache;


-(PhoneGapCommand*) initWithWebView:(UIWebView*)theWebView
{
    self = (URLCache*)[super initWithWebView:(UIWebView*)theWebView];
    if (self) 
	{
		NSURLCache *sharedCache = [[NSURLCache alloc] initWithMemoryCapacity:0 
																diskCapacity:0 
																	diskPath:nil];
		[NSURLCache setSharedURLCache:sharedCache];
		[sharedCache release];
		
		[ self initCache ];
		
		[ self initPaths ];
    }
	return self;
}

- (void) getCachedPathforURI:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
	NSUInteger argc = [arguments count];
	
	if (argc < 1)
		return; // TODO: JM ?
	

	self.urlToCache = [arguments objectAtIndex:0];
	
	NSURL * theURL = [ NSURL URLWithString:self.urlToCache ];
	
	/* get the path to the cached image */
	
	[filePath release]; /* release previous instance */
	
	NSString *fileName = [[theURL path] lastPathComponent];
	self.filePath = [[dataPath stringByAppendingPathComponent:fileName] retain];
    
	/* apply daily time interval policy */
	
	/* In this program, "update" means to check the last modified date 
	 of the image to see if we need to load a new version. */
	
	[self getFileModificationDate];
	/* get the elapsed time since last file update */
	NSTimeInterval time = fabs([fileDate timeIntervalSinceNow]);
	if (time > URLCacheInterval) 
	{
		/* file doesn't exist or hasn't been updated for at least one day */
		//NSLog(@"Gonna Cache me some path!"); 
		
		[[URLCacheConnection alloc] initWithURL:theURL delegate:self];
	}
	else 
	{
		
		// found it, and it hasn't expired
						  
		NSString * jsCallBack = [NSString stringWithFormat:@"window.plugins.urlCache._onCacheCallbackSuccess(\"%@\",\"%@\");",urlToCache,filePath];
		//NSLog(@"Cache Hit! %@", jsCallBack);
		[webView stringByEvaluatingJavaScriptFromString:jsCallBack];
	}
}

- (void) removeCachedResourceByURI:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options
{
	
}

- (void) initPaths
{
	/* create and load the URL array using the strings stored in URLCache.plist */
    NSString *path = [[NSBundle mainBundle] pathForResource:@"URLCache" ofType:@"plist"];
    if (path) 
	{
        NSArray *array = [[NSArray alloc] initWithContentsOfFile:path];
        self.urlArray = [[NSMutableArray alloc] init];
        for (NSString *element in array) {
            [self.urlArray addObject:[NSURL URLWithString:element]];
        }
        [array release];
    }
}

- (void) initCache
{
	/* create path to cache directory inside the application's Documents directory */
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    self.dataPath = [[paths objectAtIndex:0] stringByAppendingPathComponent:@"URLCache"];
	
	/* check for existence of cache directory */
	if ([[NSFileManager defaultManager] fileExistsAtPath:dataPath]) 
	{
		// cache exists, nothing else to do
		return;
	}
	
	/* create a new cache directory */
	if (![[NSFileManager defaultManager] createDirectoryAtPath:dataPath 
								   withIntermediateDirectories:NO
													attributes:nil 
														 error:&error]) {
		NSLog(@"initCache Error :: %@", error);
		return;
	}
}

/* removes every file in the cache directory */

- (void) clearCache
{
	/* remove the cache directory and its contents */
	if (![[NSFileManager defaultManager] removeItemAtPath:dataPath error:&error]) {
		// callback with error
		return;
	}
	
	/* create a new cache directory */
	if (![[NSFileManager defaultManager] createDirectoryAtPath:dataPath 
								   withIntermediateDirectories:NO
													attributes:nil 
														 error:&error]) {
		// callback with error
		return;
	}
	// callback success
}	

/* get modification date of the current cached image */
- (void) getFileModificationDate
{
	/* default date if file doesn't exist (not an error) */
	self.fileDate = [NSDate dateWithTimeIntervalSinceReferenceDate:0];
	
	if ([[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
		/* retrieve file attributes */
		NSDictionary *attributes = [[NSFileManager defaultManager] attributesOfItemAtPath:filePath error:&error];
		if (attributes != nil) 
		{
			self.fileDate = [attributes fileModificationDate];
		}
		else 
		{
			// handle error
		}
	}
}

/*
 ------------------------------------------------------------------------
 URLCacheConnectionDelegate protocol methods
 ------------------------------------------------------------------------
 */

#pragma mark -
#pragma mark URLCacheConnectionDelegate methods

- (void) connectionDidFail:(URLCacheConnection *)theConnection
{	
	NSString * jsCallBack = [NSString stringWithFormat:@"window.plugins.urlCache._onCacheCallbackFail(\"%@\",\"TODO:Error Message\");",self.urlToCache];
	[webView stringByEvaluatingJavaScriptFromString:jsCallBack];
	
	[theConnection release];

}


- (void) connectionDidFinish:(URLCacheConnection *)theConnection
{	
	if ([[NSFileManager defaultManager] fileExistsAtPath:filePath] == YES) {
		
		/* apply the modified date policy */
		
		[self getFileModificationDate];
		NSComparisonResult result = [theConnection.lastModified compare:fileDate];
		if (result == NSOrderedDescending) {
			/* file is outdated, so remove it */
			if (![[NSFileManager defaultManager] removeItemAtPath:filePath error:&error]) {
			//	URLCacheAlertWithError(error);
			}
			
		}
	}
	
	if ([[NSFileManager defaultManager] fileExistsAtPath:self.filePath] == NO) 
	{
		/* file doesn't exist, so create it */
		[[NSFileManager defaultManager] createFileAtPath:self.filePath 
												contents:theConnection.receivedData 
											  attributes:nil];
		
		//statusField.text = NSLocalizedString (@"Newly cached image", 
									//		  @"Image not found in cache or new image available.");
	}
	else 
	{
		//statusField.text = NSLocalizedString (@"Cached image is up to date",
						//					  @"Image updated and no new image available.");
	}
	
	/* reset the file's modification date to indicate that the URL has been checked */
	
	
//	NSDictionary *dict = [[NSDictionary alloc] initWithObjectsAndKeys:[NSDate date], NSFileModificationDate, nil];
//	if (![[NSFileManager defaultManager] setAttributes:dict ofItemAtPath:filePath error:&error]) 
//	{
//		//URLCacheAlertWithError(error);
//	}
//	[dict release];
	
	//[self stopAnimation];
	//[self buttonsEnabled:YES];
	//[self displayCachedImage];
	
	NSString * jsCallBack = [NSString stringWithFormat:@"window.plugins.urlCache._onCacheCallbackSuccess(\"%@\",\"%@\");",self.urlToCache,self.filePath];
	NSLog(@"%@",jsCallBack);
	[webView stringByEvaluatingJavaScriptFromString:jsCallBack];
	
	[theConnection release];
}


@end
