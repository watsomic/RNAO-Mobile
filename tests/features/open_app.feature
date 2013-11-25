Feature: Open Application
	As a nurse in training
	I want to find a reference guide
	In order to learn my nursing practice
	
	Scenario: With a data connection and no local data
		Given I have a data connection (EDGE, 3G, etc)
		Given I have no local data
		When I run RNAO for the first time
		Then the home page appears
		
	Scenario: With a network connection and no local data
		Given I have a  network connection (wifi)
		Given I have no local data
		When I run RNAO for the first time
		Then the home page appears
		
	Scenario: With no network connection and no local data
		Given I have no network connection
		Given I have no local data
		When I run RNAO for the first time
		Then I see a friendly network message
		Then I learn that a network connection is needed
