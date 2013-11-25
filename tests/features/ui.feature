Feature: Scaling Font Size
	As a nurse in training
	I want to find a reference guide
	In order to learn my nursing practice
	
	Scenario: Adjusting the font size
		Given I am on the home screen
		When I press the font scaling button
		Then the font becomes larger
		
	Scenario: Resetting the font size
		Given that the font size is normal
		When I press the font scaling button 3x
		Then the font is still normal
		
	Scenario: Persistent Font size
		Given that the font size is enlarged
		When I go to a new page
		Then the font is the same size