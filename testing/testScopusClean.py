import pytest
import sys

sys.path.append("../back_end/cdk/lambda/scopusClean")

from scopusClean import cleanName
# from ..cdk.lambda.scopusClean. import cleanName  # Assuming the cleanName function is in a file called my_module.py

def testCleanName():
    test_cases = [
        ("Doe, John Michael", ("John", "Doe")),
        ("Smith-Jones, Jane Mary", ("Jane", "Smith-Jones")),
        ("Garcia, Maria", ("Maria", "Garcia")),
        ("O'Reilly, Sean Patrick", ("Sean", "O'Reilly")),
        ("invalid_name", (None, None))
    ]

    for input_name, expected_output in test_cases:
        result = cleanName(input_name)
        assert result == expected_output, f"Expected {expected_output}, got {result}"