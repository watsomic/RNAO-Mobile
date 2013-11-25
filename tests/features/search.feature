Feature: Online Search
	As a nurse in training
	I need to search the articlces
	In order to find the correct guide

	Scenario: Opening Search
		Given I have a network connection
		When I press the search button
		Then the input field receives focus
		
	Scenario: Pressing Search Icon
		Given I have a network connection
		Given I have opened the search
		When type 'Pain'
		When I click the search icon
		Then the search results appear
		
	Scenario: Press RETURN key
		Given I have a network connection
		Given I have opened the search
		When type 'Pain'
		When I press the RETURN key
		Then the search results appear
		
	Scenario: View Result
		Given I have a network connection
		Given that I searched for 'pain'
		When I click a result
		Then I see the resulting page
		
	Scenario: Closing Search
		Given I have a network connection
		Given that I pressed the search button
		When I press the close button (X)
		Then the search field disappears
		Then I see the previous list or page contents