Feature: Full Update / Sync
  As a nurse in training
  I need the application to run offline
  In order to use it on site

  Scenario: Running an update
		Given I have a network connection
		When I press the update button
		Then I see "Finding outdated items.."
		Then I see "Updating pages..."
		Then I see "Updating lists..."