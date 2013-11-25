Feature: Viewing a Page (Node)
	As a nurse in training
	I want to find a guide
	In order to learn while I work
	
	Scenario: Open a page (Repeat for cached)
		Given I have a network connection
		When I select a page that is not cached
		Then I see the page content
		
Feature: Navigating Pages
	As a nurse in training
	I want to browser the articles
	To learn a subject area
	
	Scenario: Go to Parent List View
		Given I have navigated to a page
		When I select the parent breadcrumb
		Then I see the parent list view
		
	Scenario: Go to Sibling Page (Repeat for cached)
		Given that I have navigated to a page
		When I select the next or previous arrow
		Then I see the next or previous sibling page
	
	Scenario: Go to Last Page (Repeat for cached)
		Given that I have navigated to the first page
		When I select the previous arrow
		Then I see the last page
		
	Scenario: Go to First Page (Repeat for cached)
		Given that I have navigated to the last page
		When I select the next arrow
		Then I see the first page
	
	Scenario: Page with Images (Repeat for cached)
		Given that I have navigated to a page
		When it comes an image
		Then I see the images

Feature: Open External URL
	As a nurse in training
	I want to open a referenced article
	In order to learn
	
	Scenario: Online Mode
		Given that I have a network conection
		Given that I have opened a page
		When I click an external URL
		Then I see the native browser open the URL
	
	Scenario: Offline Mode
		Given that I do not have a network connection
		Given that I have opened a page
		When I click an external URL
		Then I see an alert box explaining that I am in offline mode
		
	Scenario: Open a PDF
		Given that I have a network connection
		Given that I opened "Assessment and Device Selection for Vascular Access"
		Given that I opened "Glossary of Terms"
		When I click the external link
		Then I see a PDF file load in the browser
		
Feature: Navigate within the Page (Named Anchors)
	As a nurse in training
	I want to navigate a long article
	In order to find what I am looking for
	
	Scenario: Jump to a heading
		Given that I have opened "Assessment and Device Selection for Vascular Access"
		Given that I have opened "Types of Vascular Access Devices"
		When I click a listed option, e.g. "Peripheral - Short"
		Then I jump down to the content
		
	Scenario: Jump to the top of the page
		Given that I have opened "Assessment and Device Selection for Vascular Access"
		Given that I have opened "Types of Vascular Access Devices"
		Given that I have clicked on the item "Peripheral - Short"
		When I click "Back to top"
		Then I jump to the top
		Then I cannot scroll any higher