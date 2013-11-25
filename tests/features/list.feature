Feature: Browsing the List Views
  As a nurse in training
  I want to find a guide
  In order to learn while I work

  Scenario: Open List View (Repeat for cached)
		Given I have a network connection
		When I select an list element that is not cached
		Then I see the new list view
		
	Scenario: Go to Home List View
		Given that I have navigated to a sublist
		When I select the home breadcrumb
		Then I see the home list view
		
	Scenario: Go to Sibling List View (Repeat for cached)
		Given that I have navigated to a sublist view
		When I select the next or previous arrow
		Then I see the next or previous sibling list view
	
	Scenario: Go to Last List View (Repeat for cached)
		Given that I have navigated to the first sublist view
		When I select the previous arrow
		Then I see the last sublist view
		
	Scenario: Go to First List View (Repeat for cached)
		Given that I have navigated to the last sublist view
		When I select the next arrow
		Then I see the first sublist view
	