# VPRI-innovation-dashboard

| Index                                               | Description                                             |
| :-------------------------------------------------- | :------------------------------------------------------ |
| [High Level Architecture](#High-Level-Architecture) | High level overview illustrating component interactions |
| [Deployment](#Deployment-Guide)                     | How to deploy the project                               |
| [User Guide](#User-Guide)                           | The working solution                                    |
| [Files/Directories](#Files-And-Directories)         | Important files/directories in the project              |
| [Changelog](#Changelog)                             | Any changes post publish                                |
| [Credits](#Credits)                                 | Meet the team behind the solution                       |
| [License](#License)                                 | License details                                         |

# High Level Architecture
![Alt text](./docs/images/VPRI_Architechture.png?raw=true "Architecture")

# Deployment Guide

To deploy this solution, please follow the steps laid out in the [Deployment Guide](docs/DeploymentGuide.md)

# User Guide

# Files And Directories

```text
.
├── amplify
├── backend/
├── node_modules
├── public
├── src/
│   ├── actions
|   ├── assets/images
│   ├── components/
│   │   ├── authentication/
│   │   ├── Rankings/
│   │   ├── ResearcherProfile/
│   │   ├── SearchResearchers/
│   │   │   ├── AdvancedSearch/
│   │   │   └── Search/
│   │   ├── UBCMetrics/
│   │   ├── LoadingWheel.js
│   │   └── NavigationBar.js
│   ├── graphql/
│   ├── reducers/
│   ├── views/
│   ├── .gitignore
│   ├── App.css
│   ├── App.js
│   ├── App.test.js
│   ├── aws-exports.js
│   ├── index.css
│   ├── index.js
│   ├── reportWebVitals.js
│   ├── setupTests.js
│   └── themes.js
├── .gitignore
├── .graphqlconfig.yml
├── package-lock.json
├── package.json
└── README.md
```

1. **`/backend`**: Contains all the backend code for the site
2. **`/docs`**: Contains all relevant documentation files
3. **`/src`**: Contains all the source code for the website.
   1. **`/components`**: Reusable React components.
      - Components are organized into folders, with the folder names being the page name/functionality that the components within are used for
      - Components that are not in any subfolders are used on multiple different pages, or for overall app functionality. Below is a description of these components:
        - LoadingWheel.js: Used in pages where you need to indicate loading
        - NavigationBar.js: Used in everypage to help users navigate between pages
   2. **`/graphql`**: Contains files for mutations, queries and the schema
   3. **`/reducers`**: Reducers for Login and Signup authentication states
   4. **`/views`**: Files for app routing
   5. **`/themes.js`**: Global styling for fonts. Note that most components have their own module-scoped styling.

# Changelog

# Credits

# License
