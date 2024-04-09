# test_multiples.py
import sys
sys.path.append('./users')  # Adjust this path if necessary

import unittest
# Now, we can import multiples from user_submitted_file (multiples.py)
from users.multiples import multiples

class TestMultiplesFunction(unittest.TestCase):
    def test_correctness(self):
        """Test if the multiples function returns the correct sum for below 1000."""
        expected_result = 233168  # This is the known correct result for the challenge
        self.assertEqual(multiples(), expected_result, "The function did not return the expected sum for multiples of 3 or 5 below 1000.")

    def test_return_type(self):
        """Test if the multiples function returns an integer."""
        self.assertIsInstance(multiples(), int, "The function should return an integer.")

    def test_non_negative(self):
        """Test if the multiples function returns a non-negative result."""
        self.assertGreaterEqual(multiples(), 0, "The function should return a non-negative integer.")


if __name__ == '__main__':
    unittest.main()
