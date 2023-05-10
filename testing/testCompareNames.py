import pytest
import sys

sys.path.append("../back_end/cdk/lambda/compareNames")

from compareNames import matchLastNames
from compareNames import matchFirstNames
from compareNames import SearchIdsLastName
from compareNames import SearchIdsFirstName

def testMatchLastNames():

    testCases = [
    ("Smith", "Smith", True),
    ("Garcia", "Garcia", True),
    ("Johnson", "Jonson", False),
    ("Martinez", "Martínez", True),
    ("De la Cruz", "De la Cruz", True),
    ("O'Neill", "O'Neil", False),
    ("Brown", "Browne", False),
    ("Doe", "Doe", True),
    ("Perez", "Pérez", True),
    ("Van Dyke", "Van Dyke", True),
    ("Lopez", "López", True),
    ("Rodriguez", "Rodríguez", True),
    ("Macdonald", "McDonald", False),
    ("Schultz", "Schulz", False),
    ("Washington", "Washington", True),
    ("Lee", "Li", False),
    ("Gonzalez", "González", True),
    ("Harris", "Harrison", False),
    ("Clark", "Clarke", False),
    ("Lewis", "Louis", False),
    ("Robinson", "Robertson", False),
    ("Walker", "Walter", False),
    ("Young", "Yung", False),
    ("King", "Kings", False),
    ("Wright", "Right", False),
    ("Scott", "Scot", False),
    ("Nguyen", "Nguyễn", True),
    ("Murphy", "Murphey", False),
    ("Rivera", "Ribera", False),
    ("Cook", "Cooke", False),
    ("Bell", "Belle", False),
    ("Cooper", "Cuper", False),
    ("Richardson", "Richardsson", False),
    ("Cox", "Cox", True),
    ("Howard", "Howards", False),
    ("Ward", "Wards", False),
    ("Torres", "Torrez", False),
    ("Peterson", "Petersen", False),
    ("Gray", "Grey", False),
    ("Ramirez", "Ramírez", True),
    ("James", "Jameson", False),
    ("Wells", "Welles", False),
    ("Chen", "Chén", True),
    ("Mills", "Milles", False),
    ("Nichols", "Nikols", False),
    ("Duncan", "Dunkin", False),
    ("Lambert", "Lambertz", False),
    ("Hale", "Hales", False),
    ("Snyder", "Sneider", False),
    ("Simmons", "Simones", False),
    ("Dawson", "Dauson", False),
    ("Fletcher", "Fleischer", False),
    ("Walsh", "Welsh", False),
    ("Fisher", "Vischer", False),
    ("Schneider", "Schnieder", False),
    ("Meyer", "Meier", False),
    ("Boyd", "Boyde", False),
    ("Mendoza", "Mendozza", False),
    ("Simpson", "Sympson", False),
    ("Morales", "Moralez", False),
    ("Ortiz", "Ortez", False),
    ("Guzman", "Guzmán", True),
    ("Fox", "Faux", False),
    ("Black", "Blak", False),
    ("Mason", "Masson", False),
    (None, "David", False), # None is not a valid last name
    ("David", None, False), # None is not a valid last name
    ]

    for scopusLastName, institutionLastName, expectedOutput in testCases:
        result = matchLastNames(scopusLastName, institutionLastName)
        assert result == expectedOutput, f"For {scopusLastName}, {institutionLastName} Expected {expectedOutput}, got {result}"

def testMatchFirstNames():
    testCases = [
    ("John", "John", True),
    ("John", "Jon", False),
    ("John", "john", True),
    ("John", "JohN", True),
    ("John", "Jonathan", False),
    ("John", "Johnathan", False),
    ("John", "Jack", False),
    ("Johannes", "Johannes", True),
    ("Johannes", "Hannes", False),
    ("Johannes", "Johann", False),
    ("Johannes", "Johans", False),
    ("José", "Jose", True),
    ("José", "jose", True),
    ("José", "Joseph", False),
    ("Maria", "María", True),
    ("Maria", "mary", False),
    ("Maria", "Marie", False),
    ("Maria", "Mariya", False),
    ("William", "Will", False),
    ("William", "Bill", False),
    ("Robert", "Bob", False),
    ("Robert", "Rob", False),
    ("Michael", "Mike", False),
    ("Elizabeth", "Liz", False),
    ("Elizabeth", "Eliza", False),
    ("Elizabeth", "Beth", False),
    ("Elizabeth", "Betsy", False),
    ("James", "Jim", False),
    ("James", "Jimmy", False),
    ("Charles", "Charlie", False),
    ("Charles", "Chuck", False),
    ("Alexander", "Alex", False),
    ("Alexander", "Xander", False),
    ("Thomas", "Tom", False),
    ("Theodore", "Theo", False),
    ("Theodore", "Ted", False),
    ("Nicholas", "Nick", False),
    ("Benjamin", "Ben", False),
    ("Nathaniel", "Nate", False),
    ("Nathaniel", "Nat", False),
    ("Abigail", "Abby", False),
    ("Abigail", "Gail", False),
    ("Margaret", "Maggie", False),
    ("Margaret", "Peggy", False),
    ("Margaret", "Marge", False),
    ("John A.", "John A.", True),
    ("John A.", "John", True), # Not sure if this should return false or true
    ("John A.", "John B.", False),
    ("John A.", "John Alexander", True),
    ("John A.", "John Andrew", True),
    ("John A.", "John B. Alexander", False),
    ("John Alexander", "John A.", True),
    ("John Alexander", "John", True),
    ("John Alexander", "John B.", False),
    ("John Alexander", "John A. Smith", True),
    ("John Alexander", "John B. Smith", False),
    ("John Alexander Smith", "John A. Smith", True),
    ("John Alexander Smith", "John A Smith", True),
    ("John Alexander Smith", "John A. S.", True),
    ("John Alexander Smith", "John B. Smith", False),
    ("John Alexander Smith", "John B Smith", False),
    (None, "David", False), # None is not a valid first name
    ("David", None, False), # None is not a valid first name
    ]


    for scopusFirstName, institutionFirstName, expectedOutput in testCases:
        result = matchFirstNames(scopusFirstName, institutionFirstName)
        assert result == expectedOutput, f"For {scopusFirstName}, {institutionFirstName} Expected {expectedOutput}, got {result}"

# def testSearchIdsLastName():

#     testCases = [
#         # Test case with multiple last name matches
#         ("Doe", [{"NAME": "Matthew Doe", "CLEANED_LAST_NAME": "Doe", "CLEANED_FIRST_NAME": "Matthew", "SCOPUS_ID": "123"},
#         {"NAME": "Matthew Dow", "CLEANED_LAST_NAME": "Dow", "CLEANED_FIRST_NAME": "Matthew", "SCOPUS_ID": "1234"},
#         {"NAME": "Marvin Doe", "CLEANED_LAST_NAME": "Doe", "CLEANED_FIRST_NAME": "Marvin", "SCOPUS_ID": "17654"}], 
#         (True, [{"SCOPUS_NAME": "Matthew Doe", "SCOPUS_CLEANED_LAST_NAME": "Doe", "SCOPUS_CLEANED_FIRST_NAME": "Matthew", "SCOPUS_ID": "123"},
#         {"SCOPUS_NAME": "Marvin Doe", "SCOPUS_CLEANED_LAST_NAME": "Doe", "SCOPUS_CLEANED_FIRST_NAME": "Marvin", "SCOPUS_ID": "17654"}])),

#         # Test case where there are no matches
#         ("Ng", [{"NAME": "Bing Bong", "CLEANED_LAST_NAME": "Bong", "CLEANED_FIRST_NAME": "Bing", "SCOPUS_ID": "543"}],
#         (False, []))
#     ]

#     for lastName, scopusIdRows, expectedOutput in testCases:
#         result = SearchIdsLastName(lastName, scopusIdRows)
#         assert result == expectedOutput, f"Expected {expectedOutput}, got {result}"

# def testSearchIdsFirstName():

#     testCases = [
#         ("Matthew D", [{"SCOPUS_NAME": "Matthew D Ding", "SCOPUS_CLEANED_LAST_NAME": "Ding", "SCOPUS_CLEANED_FIRST_NAME": "Matthew D", "SCOPUS_ID": "543"}, 
#         {"SCOPUS_NAME": "David D lancaster", "SCOPUS_CLEANED_LAST_NAME": "lancaster", "SCOPUS_CLEANED_FIRST_NAME": "David D", "SCOPUS_ID": "134"}],
#         (True, [{"SCOPUS_NAME": "Matthew D Ding", "SCOPUS_CLEANED_LAST_NAME": "Ding", "SCOPUS_CLEANED_FIRST_NAME": "Matthew D", "SCOPUS_ID": "543", 'NUMBER_OF_MATCHED_WORDS_IN_FIRST_NAME': 2}])),
#     ]

#     for firstName, lastNameMatches, expectedOutput in testCases:
#         result = SearchIdsFirstName(firstName, lastNameMatches)
#         assert result == expectedOutput, f"Expected {expectedOutput}, got {result}"

    

    