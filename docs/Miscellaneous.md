# Miscellaneous Information

### How to Change the Displayed App Name

The current app name displayed on the user interface is `Expertise Portal`
There are 3 locations in the front-end codes where the app name is displayed:

- Login page
  - To change the name displayed on the login page, navigate to `src/App.js`.

- Navigation bar
  - To change the name displayed on the navigation bar, navigate to `src/Components/NavigationBar.js`.

- Search Bar
  - Navigate to `src/Components/SearchResearchers/Search/SearchComponent.js`

### VPC CIDR Range

The CIDR range configured in the Vpc-Stack is `10.0.0.0/16` and is also the default range that AWS will set for any Vpc. This values could be overwritten in the future
at your chosen.
