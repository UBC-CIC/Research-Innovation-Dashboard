# Backend and Frontend Stack Deep Dive

## Architecture

![Architecture diagram](../docs/images/architecture-diagram.png)

## Description
### Back End Flow (1-14)
![Architecture diagram](../docs/images/architecture-diagram-back-end.png)

1. Raw Scopus and UBC HR data are fetched from an Amazon S3 bucket in the form of comma separated values (CSV) files. Both datasets are cleaned which involves standardizing the names present in both datasets. The results are then stored as CSV files in a new folder within the S3 bucket.
2. The standardized names are compared in order to match Scopus Ids to UBC HR data. This process uses a string metric called Jaro-Winkler distance in order to determine if two names are the same. The match that has the highest Jaro-Winkler distance is considered to be the closest match. If the Jaro-Winkler distance is above a certain threshold the match is considered final. If the match is below the threshold then the match requires further processing in step 3. If two or more potential matches have the same Jaro-Winkler Distance those matches are processed further in step 4.
3. The matches that failed to meet the Jaro-Winkler distance threshold are further processed by comparing data obtained from Scopus to the UBC HR data. First there is a comparison between the researchers department and subject area data from Scopus. Next there is a comparison between the researchers name and name variants present on Scopus.
4. The researchers that have been matched to more than one Scopus Id are processed further by comparing Scopus subject area and name variant data against UBC department and faculty data.
5. Researchers whose Scopus Id’s were identified in steps 2-4 have their data stored in the Postgres database.
6. For each Scopus Id in the database, metrics are fetched from the SciVal and Scopus APIs. Number of documents, number of citations, and ORCID Id are obtained from Scopus and a 5-year h-index is obtained from SciVal. This data is stored in the Postgres database.
7. The number of filed patents listed on ORCID is fetched from the ORCID API and stored in the database
8. Each researcher's publication data is fetched from the Scopus API and stored in the database. This data includes each publication’s title, associated keywords, author names and Scopus ids, journal title, and the number of times the publication has been cited.
9. Every Saturday at midnight a python docker container hosted on AWS fargate will be run to update the publications of the researchers in the database. The container will update researcher’s h-indexes and number of publications. Update publications will also add newly published publications to the database and remove publications with no current UBC researchers.
10. When any changes are made to the PostgreSQL database AWS Data Migration Service (DMS) will replicate the new changes from the database to OpenSearch. This makes the data searchable and keeps the searches up to date.
11. When queried, the Lambda communicates with AWS OpenSearch and executes the search required.
12. AWS Appsync triggers the OpenSearch Lambda and passes the correct variables needed to execute the query.
13. When queried, Lambda connects to the RDS PostgreSQL database and gets the data requested by AppSync.
14. AWS AppSync triggers the PostgreSQL Lambda and passes the correct variables needed to get the required data.

### Front End Flow (15-18)
![Architecture diagram](../docs/images/architecture-diagram-front-end.png)

15. All queries approved by AWS Web Application Firewall (WAF) are passed to AppSync.
16. All queries are first sent to AWS WAF. This helps prevent malicious users from getting data or breaking the website with DDOS attacks.
17. Users connect to the webpage, where access to AWS resources is done through authentication using AWS Cognito.
18. Users navigate to the VPRI application in their web browser.
